const router = require('express').Router();
const { google } = require('googleapis');
var admin = require('firebase-admin');
const cors = require('cors');
var base64 = require('base-64');

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

router.post('/add-acl', async(req, res, next) => {
  try {
    const { userId } = req.body;
    const refreshToken = (await db.ref(userId + '/refreshToken').once('value')).val();
    oauth2Client.setCredentials({ refresh_token : refreshToken });
    const calendar = google.calendar('v3');
    const response = await calendar.acl.insert({
      auth: oauth2Client,
      calendarId: 'primary',
      requestBody: {
        role: 'reader',
        scope: {
          type: 'default',
        }
      }
    });
    res.send(response);
  } catch(error) {
    next(error);
  }
});

router.post('/add-event', async(req, res, next) => {
  try {
    const { studentId, title, description, group, startTime, endTime } = req.body;
    const refreshToken = (await db.ref(studentId + '/refreshToken').once('value')).val();
    oauth2Client.setCredentials({ refresh_token : refreshToken });
    const calendar = google.calendar('v3');
    calendar.events.insert({
      auth: oauth2Client,
      calendarId: 'primary',
      requestBody: {
        summary: title,
        description: description,
        start: {
          dateTime: (process.env.NODE_ENV ==='production' ? 
            new Date((new Date(startTime)).setHours((new Date(startTime).getHours() - 7))) : new Date(startTime)),
          //timeZone: "UTC+07:00"
        },
        end: {
          dateTime: (process.env.NODE_ENV ==='production' ? 
            new Date((new Date(endTime)).setHours((new Date(endTime).getHours() - 7))) : new Date(endTime)),
          //timeZone: "UTC+07:00"
        },
        extendedProperties: {
          shared: {
            groupName: group
          }
        }
      }
    })
    //res.send(response);
    res.send(new Date(startTime));
  } catch(error) {
    next(error);
  }
});

router.post('/add-group', async(req, res, next) => {
  try {
    const { userId, groupName, groupMember } = req.body;
    const currentMember = (await db.ref(userId + '/groups/' + groupName).once('value')).val();
    const newMember = currentMember === null ? groupMember : currentMember.concat(groupMember);
    db.ref(userId + '/groups').update({ [groupName] : newMember }); 
    res.send({ message : "Group added" });
  } catch(error) {
    next(error);
  }
});

router.post('/get-event', async(req, res, next) => {
  try {
    const { userId, eid } = req.body;
    const refreshToken = (await db.ref(userId + '/refreshToken').once('value')).val();
    const eid_decode = base64.decode(eid).split(' ')[0];
    //res.send(eid_decode);
    oauth2Client.setCredentials({ refresh_token : refreshToken });
    const event = await google.calendar('v3').events.get({
      auth: oauth2Client,
      calendarId: 'primary',
      eventId: eid_decode
    })
    res.send(event);
  } catch(error) {
    next(error);
  }
})

router.post('/remove-event', async(req, res, next) => {
  try {
    const { userId, eventId } = req.body;
    const refreshToken = (await db.ref(userId + '/refreshToken').once('value')).val();
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const response = google.calendar('v3').events.delete({
      auth: oauth2Client,
      calendarId: 'primary',
      eventId: eventId,
    })
    res.send(response);
  } catch(error) {
    next(error);
  }
});

router.post('/get-all-group', async(req, res, next) => {
  try {
    const { userId } = req.body;
    const groups = (await db.ref(userId + "/groups").once('value')).val();
    res.send(groups);
  } catch (error) {
    next(error);
  }
});

router.post('/get-group', async(req, res, next) => {
  try {
    const { userId, group } = req.body;
    const member = (await db.ref(userId + "/groups/" + group).once("value")).val();
    res.send(member);
  } catch(error) {
    next(error);
  }
});

module.exports = router;
