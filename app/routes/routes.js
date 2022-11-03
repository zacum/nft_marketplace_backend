const multer = require('multer')
const { v4: uuid_v4 } = require('uuid');

const DIR = './public/profiles/'

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, DIR);
  },
  filename: (req, file, cb) => {
      const fileName = file.originalname.toLowerCase().split(' ').join('-');
      cb(null, uuid_v4() + '-' + fileName)
  }
});

var upload = multer({
  storage: storage,
 // fileFilter: (req, file, cb) => {
 //     if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
 //         cb(null, true);
 //     } else {
 //         cb(null, false);
 //         return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
 //     }
 // }
});

module.exports = app => {
  const { db_profile, db_auction, db_bid, db_history, get_hot_auction, transfer, settle_auction, mint, update_price, add_follow, getNfts, getOwners, getNftsByAccount } = require("../controllers/controller.js");
  var router = require("express").Router();

  // *************** Profile ******************************
  // Create a new profile
  router.post("/profile/create", db_profile().create);

  // Retrieve a single profile with account
  router.get("/profile/:account", db_profile().findOne);

  // Update a profile with account
  router.put("/profile/:account", upload.fields([{name: 'profileImg', maxCount: 1}, {name: 'coverImg', maxCount: 1}]), db_profile().update);
  // Update a profile Info without profile IMG
  router.put("/profileNoProfile/:account", db_profile().updateNoImg);

  // ************** Auction **************************
  router.post("/auction/create", db_auction().create);
  router.post("/auction/update", db_auction().update);

  // ************* MakeBid ***************************
  router.post("/bid/create", db_bid().create);
  router.post("/bid/all", db_bid().findAll);
  router.post("/bid/findone", db_bid().find);

  // ************ History **************************
  router.post("/history/all", db_history().findAll);

  // ********** Get Hot Auction *******************
  router.get("/hotauction", get_hot_auction().get);

  // ********** Transfer ******************
  router.post("/transfer", transfer().create);

  // ********** Settle Auction ************
  router.post("/settleauction", settle_auction().create);

  // ********* Update Price ************
  router.post("/updateprice", update_price().create);

  // ********** mint **************
  router.post("/mint", mint().create);

  // ********** Follow action ********
  router.post("/follow/create", add_follow().create);

  router.post("/follow/all", add_follow().findAll);

  // ******** get nfts ******
  router.get('/nfts', getNfts().get)
  
  // ******** get owners ****
  router.get('/owners', getOwners().get)

  // ***** get nfts by account ****
  router.get('/nfts/:account', getNftsByAccount().get)

  app.use("/api", router);
};
