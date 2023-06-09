const cookieParser = require('cookie-parser');
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const url = require('url');
const fs = require('fs');

dotenv.config();
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));
app.set('view engine', 'ejs');
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB_SRV;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});
client.connect(async (err) => {
    const reconnect = async () => {
        await client.connect();
    };
    if (err) await reconnect();

    app.get('/getUserDetails/:token/', async (req, res) => {
        if (!client) await reconnect();
        client
            .db('treasureHunt')
            .collection('users')
            .findOne({ token: req.params.token.slice(0, -13) }, (errs, data) => {
                if (errs) res.send({ status: 'error', error: 'Server error please try again later' });
                else if (data) res.send({ status: 'success', data });
                else res.send({ status: 'error', error: 'User Token Issue' });
            });
    });

    app.post('/setUserDetails/:token/', async (req, res) => {
        if (!client) await reconnect();
        client
            .db('treasureHunt')
            .collection('users')
            .updateOne(
                { token: req.params.token.slice(0, -13) },
                { $set: { data: req.body.newData } },
                (errs, data) => {
                    if (errs) res.send({ status: 'error', error: 'Server error please try again later' });
                    else if (data) res.send({ status: 'success', data: 'Data Saved' });
                    else res.send({ status: 'error', error: 'User Token Issue' });
                },
            );
    });

    app.post('/auth/signup/', async (req, res) => {
        console.log(req.body);
        if (!req.body.email || !req.body.name || !req.body.password) {
            res.send({ status: 'error', error: 'Wrong API Data Sent' });
        } else {
            if (!client) await reconnect();
            client
                .db('treasureHunt')
                .collection('users')
                .findOne({ token: Buffer.from(`${req.body.email}-@-${req.body.password}`).toString('base64') }, (errs, dataUser) => {
                    if (errs) {
                        res.send({ status: 'error', error: 'Server error please try again later' });
                    } else if (dataUser) {
                        res.send({ status: 'error', error: 'User Already Exists' });
                    } else {
                        client
                            .db('treasureHunt')
                            .collection('users')
                            .insertOne({
                                token: Buffer.from(`${req.body.email}-@-${req.body.password}`).toString('base64'), email: req.body.email, name: req.body.name, data: { land: [], loans: [] },
                            }, (error, dataInsert) => {
                                if (error) res.send({ status: 'error', error: 'Server error please try again later' });
                                else if (dataInsert) res.send({ status: 'success', data: `${Buffer.from(`${req.body.email}-@-${req.body.password}`).toString('base64')}${new Date().getTime()}` });
                            });
                    }
                });
        }
    });

    app.post('/login/', async (req, res) => {
        if (!client) await reconnect();
        client
            .db('treasureHunt')
            .collection('users')
            .findOne({ token: Buffer.from(`${req.body.email}-@-${req.body.password}`).toString('base64') }, (errs, data) => {
                if (errs) res.send({ status: 'error', error: 'Server error please try again later' });
                else if (data) res.send({ status: 'success', data: `${Buffer.from(`${req.body.email}-@-${req.body.password}`).toString('base64')}${new Date().getTime()}` });
                else res.send({ status: 'error', error: 'Wrong Email or password' });
            });
        // console.log(Buffer.from('SGVsbG8gV29ybGQ=', 'base64').toString('ascii'));
    });
    app.get('/dashboard/*', (req, res) => {
        if (fs.existsSync(`${__dirname}/views/normal/dashboard.ejs`)) {
            try {
                if (req.cookies.userToken) {
                    client
                        .db('treasureHunt')
                        .collection('users')
                        .findOne({ token: req.cookies.userToken.slice(0, -13) }, (errs, dataUser) => {
                            if (errs) res.send({ status: 'error', error: 'Server error please try again later' });
                            else if (dataUser) res.render('normal/dashboard', dataUser);
                            else res.send({ status: 'error', error: 'User Token Issue' });
                        });
                } else {
                    res.redirect('/auth/login/');
                }
            } catch (renderError) {
                res.render('normal/404', { error: renderError, url: decodeURI(path.normalize(url.parse(req.url).pathname)) });
            }
        } else {
            res.render('normal/404', { error: 'Page Does Not Exists', url: decodeURI(path.normalize(url.parse(req.url).pathname)) });
        }
    });

    app.get('/:type/:view/', (req, res) => {
        if (fs.existsSync(`${__dirname}/views/${req.params.type}/${req.params.view}.ejs`)) {
            try {
                res.render(`${req.params.type}/${req.params.view}`, { url: decodeURI(path.normalize(url.parse(req.url).pathname)) });
            } catch (renderError) {
                res.render('normal/404', { error: renderError, url: decodeURI(path.normalize(url.parse(req.url).pathname)) });
            }
        } else {
            res.render('normal/404', { error: 'Page Does Not Exists', url: decodeURI(path.normalize(url.parse(req.url).pathname)) });
        }
    });
    app.get('/:view/', (req, res) => {
        if (fs.existsSync(`${__dirname}/views/normal/${req.params.view}.ejs`)) {
            try {
                res.render(`normal/${req.params.view}`, { url: decodeURI(path.normalize(url.parse(req.url).pathname)) });
            } catch (renderError) {
                res.render('normal/404', { error: renderError, url: decodeURI(path.normalize(url.parse(req.url).pathname)) });
            }
        } else {
            res.render('normal/404', { error: 'Page Does Not Exists', url: decodeURI(path.normalize(url.parse(req.url).pathname)) });
        }
    });
    app.get('/*', (req, res) => {
        if (req.cookies.userToken) {
            client
                .db('treasureHunt')
                .collection('users')
                // eslint-disable-next-line no-shadow
                .findOne({ token: req.cookies.userToken }, (err, data) => {
                    res.render('normal/index', { user: data });
                });
        } else { res.render('normal/index', { user: null }); }
    });

    app.post('*', (req, res) => { res.send({ status: 'error', error: 'Endpoint Not Allowed' }); });

    app.listen(5001, () => {
        console.log(`Listening on port ${5001}`);
    });
});