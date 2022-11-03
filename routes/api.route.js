const router = require('express').Router();

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

module.exports = router;
