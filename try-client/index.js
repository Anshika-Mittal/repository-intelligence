require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { Issuer, generators } = require('openid-client');
const app = express();

const clientId = process.env.COGNITO_CLIENT_ID;
const clientSecret = process.env.COGNITO_CLIENT_SECRET;
let client;
// Initialize OpenID Client
async function initializeClient() {
    const issuer = await Issuer.discover('https://cognito-idp.us-east-1.amazonaws.com/us-east-1_J3Z36w5dp');
    client = new issuer.Client({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uris: ['http://localhost:5000/auth/callback'],
        response_types: ['code']
    });
    console.log('Cognito OIDC client initialized');
};
initializeClient().catch(console.error);

app.use(session({
    secret: 'some secret',
    resave: false,
    saveUninitialized: false
}));

const checkAuth = (req, res, next) => {
    if (!req.session.userInfo) {
        req.isAuthenticated = false;
    } else {
        req.isAuthenticated = true;
    }
    next();
};

app.get('/', checkAuth, (req, res) => {
    res.render('home', {
        isAuthenticated: req.isAuthenticated,
        userInfo: req.session.userInfo
    });
});

app.get('/login', (req, res) => {
    if (!client) {
        return res.status(503).send('Authentication service is not ready');
    }

    const nonce = generators.nonce();
    const state = generators.state();

    req.session.nonce = nonce;
    req.session.state = state;

    const authUrl = client.authorizationUrl({
        redirect_uri: 'http://localhost:5000/auth/callback',
        scope: 'email openid profile',
        state: state,
        nonce: nonce,
    });

    res.redirect(authUrl);
});

// Helper function to get the path from the URL. Example: "http://localhost/hello" returns "/hello"
function getPathFromURL(urlString) {
    try {
        const url = new URL(urlString);
        return url.pathname;
    } catch (error) {
        console.error('Invalid URL:', error);
        return null;
    }
}

app.get(getPathFromURL('http://localhost:5000/auth/callback'), async (req, res) => {
    try {
        const params = client.callbackParams(req);
        const tokenSet = await client.callback(
            'http://localhost:5000/auth/callback',
            params,
            {
                nonce: req.session.nonce,
                state: req.session.state
            }
        );

        const userInfo = await client.userinfo(tokenSet.access_token);
        req.session.userInfo = userInfo;

        res.redirect('/');
    } catch (err) {
        console.error('Callback error:', err);
        res.redirect('/');
    }
});

// Logout route

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destruction failed:', err);
            return res.status(500).send('Unable to log out');
        }

        res.clearCookie('connect.sid');

        const logoutUrl = new URL(
            'https://us-east-1j3z36w5dp.auth.us-east-1.amazoncognito.com/logout'
        );

        logoutUrl.searchParams.set(
            'client_id',
            process.env.COGNITO_CLIENT_ID
        );

        logoutUrl.searchParams.set(
            'logout_uri',
            'http://localhost:5173/login'
        );

        res.redirect(logoutUrl.toString());
    });
});


app.set('view engine', 'ejs');

// Start the server only after Cognito initialization succeeds.
initializeClient()
    .then(() => {
        app.listen(5000, () => {
            console.log('Server running at http://localhost:5000');
        });
    })
    .catch((error) => {
        console.error('Cognito initialization failed:', error);
    });