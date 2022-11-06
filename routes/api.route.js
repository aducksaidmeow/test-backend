const router = require('express').Router();
const { google } = require('googleapis');
var admin = require('firebase-admin');
const cors = require('cors');

router.use(cors({
  origin: "https://aducksaidmeow.github.io",
  credentials: true
}));

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.NODE_ENV === 'production' ? 
    "https://aducksaidmeow.github.io" :
    "http://localhost:3000"
)

admin.initializeApp({
  databaseURL: process.env.DATABASE_URL,
  credential: admin.credential.cert({
    projectId: process.env.PROJECT_ID,
    clientEmail: process.env.CLIENT_EMAIL,
    privateKey: process.env.PRIVATE_KEY.replace(/\\n/gm, "\n")
  })
});

const db = admin.database();

router.get('/', async (req, res, next) => {
  res.send({ message: 'Ok api is working 🚀' });
});

router.post('/test', async(req, res, next) => {
  try { 
    res.send({ message: "Success!" });
  } catch(error) {
    next(error);
  }
});

router.post('/get-token', async(req, res, next) => {
  try {
    const { code } = req.body;
    const { tokens } = await oauth2Client.getToken(code);
    res.send(tokens);
  } catch(error) {
    next(error);
  }
});

router.post('/init', async(req, res, next) => {
  try {
    const { userId, refreshToken } = req.body;
    const ref = db.ref(userId);
    ref.update({ refreshToken : refreshToken });
    res.send({ message: "User initialized successfully!" });
  } catch(error) {
    next(error);
  }
});

router.post('/get-role', async(req, res, next) => {
  try {
    const { userId } = req.body;
    const ref = db.ref(userId + '/role');
    const role = (await ref.once('value')).val();
    res.send(role);
  } catch(error) {
    next(error);
  }
});

router.post('/add-role', async(req, res, next) => {
  try {
    const { userId, role } = req.body;
    const ref = db.ref(userId);
    ref.update({ role : role });
    res.send({ message: "Role added" });
  } catch(error) {
    next(error);
  }
});

module.exports = router;
