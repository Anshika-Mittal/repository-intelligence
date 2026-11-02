const express = require('express')
const bodyParser = require('body-parser')

const {
    CognitoIdentityProviderClient,
    SignUpCommand,
    ConfirmSignUpCommand,
    InitiateAuthCommand,
    AssociateSoftwareTokenCommand,
    VerifySoftwareTokenCommand,
    RespondToAuthChallengeCommand
} = require('@aws-sdk/client-cognito-identity-provider');

const jwt = require('jsonwebtoken')
require('dotenv').config();
console.log(
    'CLIENT_ID loaded:',
    Boolean(process.env.CLIENT_ID)
);

const app = express()
const port = process.env.PORT || 3000;

const cognito = new CognitoIdentityProviderClient({
    region: process.env.AWS_REGION
});
const CLIENT_ID = process.env.CLIENT_ID;
const jwt_secret = process.env.JWT_SECRET;

const crypto = require('crypto');

const CLIENT_SECRET = process.env.CLIENT_SECRET;

function getSecretHash(username) {
    return crypto
        .createHmac('sha256', CLIENT_SECRET)
        .update(username + CLIENT_ID)
        .digest('base64');
}

app.use(bodyParser.json());

const authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization;

    if (token){
        jwt.verify(token, jwt_secret, (err, user) => {
            if (err){
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    }
    else{
        res.sendStatus(401);
    }
};

app.post('/signup', async (req, res) => {
    const { username, password, email } = req.body;

    const params = {
        ClientId: CLIENT_ID,
        Username: username,
        Password: password,
    SecretHash: getSecretHash(username),
        UserAttributes: [
            {
                Name: 'email',
                Value: email
            }
        ]
    };

    try {
        const data = await cognito.send(
            new SignUpCommand(params)
        );

        res.json(data);
    } catch (err) {
        console.error('Signup error:', err.name, err.message);

        res.status(400).json({
            error: err.name,
            message: err.message
        });
    }
});

app.post('/confirm', async (req, res) => {
    const { username, confirmationCode } = req.body;

    if (!username || !confirmationCode) {
        return res.status(400).json({
            message: 'Username and confirmation code are required'
        });
    }

    const params = {
        ClientId: CLIENT_ID,
        Username: username,
        ConfirmationCode: confirmationCode,
        SecretHash: getSecretHash(username)
    };

    try {
        const data = await cognito.send(
            new ConfirmSignUpCommand(params)
        );

        res.status(200).json({
            message: 'User confirmed successfully'
        });
    } catch (err) {
        console.error('Confirmation error:', err.name, err.message);

        res.status(400).json({
            error: err.name,
            message: err.message
        });
    }
});



app.post('/signin', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            message: 'Username and password are required'
        });
    }

    const params = {
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: CLIENT_ID,
        AuthParameters: {
            USERNAME: username,
            PASSWORD: password,
            SECRET_HASH: getSecretHash(username)
        }
    };

    try {
        const data = await cognito.send(
            new InitiateAuthCommand(params)
        );

        // Cognito can return a challenge instead of tokens.
        if (!data.AuthenticationResult) {
            return res.status(200).json({
                message: 'Additional authentication required',
                challengeName: data.ChallengeName,
                session: data.Session
            });
        }

        const accessToken = data.AuthenticationResult.AccessToken;

        const token = jwt.sign(
            { username, accessToken },
            jwt_secret,
            { expiresIn: '1h' }
        );

        res.status(200).json({ token });

    } catch (err) {
        console.error('Signin error:', err.name, err.message);

        res.status(400).json({
            error: err.name,
            message: err.message
        });
    }
});


app.get('/demoPage', authenticateJWT, (req, res)=>{
    res.json({message: 'Welcome to protected route'});
})

app.post('/logout', authenticateJWT, async (req, res)=>{
    const token = req.headers.authorization;
    const params = {
        AccessToken: token
    };
    try{
        await cognito.globalSignOut(params);
        res.json({message: 'Successfully signed out'});
    }
    catch(err){
        res.status(400).json(err);
    }
});

app.post('/mfa/setup', async (req, res) => {
    const { session } = req.body;

    try {
        const result = await cognito.send(
            new AssociateSoftwareTokenCommand({
                Session: session
            })
        );

        res.json({
            secretCode: result.SecretCode,
            session: result.Session
        });
    } catch (err) {
        console.error('MFA setup error:', err.name, err.message);
        res.status(400).json({
            error: err.name,
            message: err.message
        });
    }
});

app.post('/mfa/verify', async (req, res) => {
    const { username, userCode, session } = req.body;

    try {
        // Step 1: Verify the code from the authenticator app.
        const verified = await cognito.send(
            new VerifySoftwareTokenCommand({
                Session: session,
                UserCode: userCode
            })
        );

        if (verified.Status !== 'SUCCESS') {
            return res.status(400).json({
                message: 'MFA verification failed'
            });
        }

        // Step 2: Complete the original MFA_SETUP challenge.
        const result = await cognito.send(
            new RespondToAuthChallengeCommand({
                ClientId: CLIENT_ID,
                ChallengeName: 'MFA_SETUP',
                Session: verified.Session,
                ChallengeResponses: {
                    USERNAME: username,
                    SECRET_HASH: getSecretHash(username)
                }
            })
        );

        if (!result.AuthenticationResult) {
            return res.status(401).json({
                message: 'Authentication is not yet complete',
                challengeName: result.ChallengeName,
                session: result.Session
            });
        }

        res.json({
            message: 'MFA setup complete and sign-in successful',
            accessToken: result.AuthenticationResult.AccessToken,
            idToken: result.AuthenticationResult.IdToken,
            refreshToken: result.AuthenticationResult.RefreshToken
        });
    } catch (err) {
        console.error('MFA verification error:', err.name, err.message);

        res.status(400).json({
            error: err.name,
            message: err.message
        });
    }
});

app.listen(port, ()=>{
    console.log("App running on http://localhost:3000");
})