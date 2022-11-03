const db = require("../models");
const {MINT, AUCTION_CREATED, TRANSFER, PRICE_UPDATED, AUCTION_CANCEL, AUCTION_SETTLE} = require("./type.js");
const Profile = db.table.Profile;
const Auction = db.table.Auction;
const Bid = db.table.Bid;
const History = db.table.History;
const Follow = db.table.Follow;
const NftItem = db.table.NftItem
const Owner = db.table.Owner

const create_history = (tokenId, event, owner, from="", to="", prevPrice="", currPrice="") => {
  try {
    let newHistory = {tokenId: tokenId, event: event, owner: owner};
    switch (event) {
      case MINT:
        {
          newHistory.currPrice = currPrice;
          break;
        }
      case TRANSFER:
      case AUCTION_SETTLE:
        {
          newHistory.from = from;
          newHistory.to = to;
          break;
        }
      case PRICE_UPDATED:
        {
          newHistory.prevPrice = prevPrice;
          newHistory.currPrice = currPrice;
        }
    }

    const history = new History(newHistory);
    history.save(history)
  } catch (error) {
    console.log("Create History ", error)
  }
}

const db_profile = () => {
  // Create and Save a new Profile
  create = (req, res) => {
    // Validate request
    if (!req.body.account) {
      res.status(400).send({ message: "Content can not be empty!" });
      return;
    }
  
    // Create a profile
    const profile = new Profile({
      account: req.body.account,
    });
  
    // Save profile in the database
    profile
      .save(profile)
      .then(data => {
        res.send(data);
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while creating the profile."
        });
      });
  };
  
  // Find a single profile with an id
  findOne = (req, res) => {
    const account = req.params.account;
  
    Profile.find({account:account})
      .then(data => {
        if (data.length == 0) {
          // Create a profile
          const profile = new Profile({
            account: account,
          });
          // Save profile in the database
          profile
            .save(profile)
            .then(data => {
              res.send(data);
            })
            .catch(err => {
              res.status(500).send({
                message:
                  err.message || "Not found profile with account. Some error occurred while creating the profile."
              });
            });
        }
        else res.send(data);
      })
      .catch(err => {
        res
          .status(500)
          .send({ message: "Error retrieving profile with account=" + account });
      });
  };
  
  // Update a profile by the id in the request
  update = (req, res) => {
    if (!req.body) {
      return res.status(400).send({
        message: "Data to update can not be empty!"
      });
    }
 // console.log(req.protocol, 'protocol')  
    const url = 'https' + '://' + req.get('host')
   // const url = 'https://dck12vch2w2i7.cloudfront.net'
    const account = req.params.account;
    
    const profile ={$set: {
      name: req.body.name,
      profileUrl: req.body.profileUrl,
      email: req.body.email,
      facebook: req.body.facebook,
      bio: req.body.bio,
      instagram: req.body.instagram,
      discord: req.body.discord,
      twitter: req.body.twitter
    }};
    if(req.files['profileImg']) profile.$set.profileImg = url + '/profiles/' + req.files['profileImg'][0].filename
    if(req.files['coverImg']) profile.$set.coverImg = url + '/profiles/' + req.files['coverImg'][0].filename
    Profile.updateOne({account: account}, profile, { useFindAndModify: false })
      .then(data => {
        if (!data) {
          res.status(404).send({
            message: `Cannot update profile with account=${account}. Maybe profile was not found!`
          });
        } else res.send({ message: "profile was updated successfully.", data: data });
      })
      .catch(err => {
        res.status(500).send({
          message: "Error updating profile with account=" + account
        });
      });
  };

  updateNoImg = (req, res) => {
    if (!req.body) {
      return res.status(400).send({
        message: "Data to update can not be empty!"
      });
    }
  
    const account = req.params.account;
    const profile ={$set: {
      name: req.body.name,
      profileUrl: req.body.profileUrl
    }};
  
    Profile.updateOne({account: account}, profile, { useFindAndModify: false })
      .then(data => {
        if (!data) {
          res.status(404).send({
            message: `Cannot update profile with account=${account}. Maybe profile was not found!`
          });
        } else res.send({ message: "profile was updated successfully." });
      })
      .catch(err => {
        res.status(500).send({
          message: "Error updating profile with account=" + account
        });
      });
  };

  return { create, findOne, update, updateNoImg}
}

const db_auction = () => {
  // Create and Save a new Auction
  create = (req, res) => {
    // Validate request
    if (!req.body.tokenId && ! req.body.owner) {
      res.status(400).send({ message: "Content can not be empty!" });
      return;
    }
  
    // Create a Auction
    const new_auction = new Auction({
      tokenId: req.body.tokenId,
      owner: req.body.owner,
      status: "create"
    });
  
    // Save Auction in the database
    new_auction
      .save(new_auction)
      .then(data => {
        res.send(data);
        create_history(req.body.tokenId, AUCTION_CREATED, req.body.owner);
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while creating the Auction."
        });
      });
  };

  update = (req, res) => {
    // Validate request
    if (!req.body.tokenId && ! req.body.owner) {
      res.status(400).send({ message: "Content can not be empty!" });
      return;
    }

    const find_cond = {
      tokenId: req.body.tokenId,
      owner: req.body.owner,
      status: "create"
    };

    Auction.updateOne(find_cond, { $set: { status: req.body.status }}, { useFindAndModify: false })
    .then(data => {
      if (!data) {
        res.status(404).send();
      } else {
        res.send({ message: "Auction was updated successfully." });
        create_history(req.body.tokenId, AUCTION_CANCEL, req.body.owner);
      } 
    })
    .catch(err => {
      res.status(500).send({
        message: "Error updating auction with owner=" + req.body.owner
      });
    });
  };

  return { create, update }
}

const db_bid = () => {
  create = (req, res) => {
    if(!req.body.tokenId && !req.body.bidder && !req.body.amount && !req.body.nftOwner){
      res.status(400).send({ message: "Content can not be empty!" });
      return;
    }

    Auction.find({tokenId: req.body.tokenId, owner: req.body.nftOwner, status: "create"})
    .then( data => {
      if(data) {
        const bid = new Bid({
          auction_id: data[0]._id,
          bidder: req.body.bidder,
          amount: req.body.amount,
          recipient: req.body.recipient,
          status: "bid"
        })
  
        bid.save(bid)
        .then(data => {
          res.send(data);
        })
        .catch(err => {
          res.status(500).send({
            message:
              err.message || "Some error occurred while creating the bid."
          });
        });
      } else {
        res.send(data);
      }
    })
    
  }

  findAll = (req, res) => {
    Auction.find(req.body)
    .then( data => {
      Bid.aggregate([
          { 
            $lookup: 
            {
              from: 'profiles',
              localField: 'bidder',
              foreignField: 'account',
              as: 'bidder_info'
            }
          }
        ]).then( join_data => {
          const match_data = join_data.filter(item => 
            item.auction_id == data[0]?._id
        )
        res.send({bids: match_data});
      })
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving Bids."
      });
    });
  };

  find = (req, res) => {
    Auction.find({tokenId: req.body.tokenId, owner: req.body.nftOwner, status: "create"})
    .then( data => {
      if(data.length == 0) {
        const cond = {
          auction_id: data[0]._id,
          bidder: req.body.bidder,
          status: "bid"
        }
        
        Bid.find(cond)
        .then( data => {
          res.send(data);
        })
        .catch(err => {
          res.status(500).send({
            message:
              err.message || "Some error occurred while finding the bid."
          });
        });
      } else {
        res.send(data);
      }
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while finding the bid."
      });
    });
  }

  return { create, findAll, find }
}

const db_history = () => {
  findAll = (req, res) => {
    const tokenId = req.body.tokenId;
    History.aggregate([
      {
        $lookup:
        { 
          from: 'profiles',
          localField: 'owner',
          foreignField: 'account',
          as: 'history_info'
        }
      }
    ]).then( join_data => {
      const match_data = join_data.filter(item => 
        item.tokenId == tokenId  
      )
      res.send({historys: match_data})
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving Historys."
      });
    });
  };


  return { findAll }
}

const get_hot_auction = () => {
  get = (req, res) => {
    let hot_data = [];
    try {
      Auction.find({status:"create"})
      .then( data => {
        new Promise((resolve, reject) => {
          data.forEach( (item) => {
            Bid.find({auction_id: item._id, status: 'bid'})
            .then( bid_data => {
              hot_data.push({tokenId: item.tokenId, bid_count: bid_data.length });
              if(hot_data.length == data.length) {
                resolve(true);
              }
            })
          })
        }).then( ()=> {
          hot_data.sort( (a, b) => 
            b.bid_count - a.bid_count
          )
          res.send({hots:hot_data.slice(0, 10)});
        })
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while retrieving Hot Auction."
        });
      });
    } catch (error) {
      console.log(error);
    }
  }

  return { get }
}

const transfer = () => {
  create = (req, res) => {
    try {
      create_history(req.body.tokenId, TRANSFER, req.body.owner, req.body.from, req.body.to);
      res.send({msg: "successfully"});
    } catch (error) {
      res.status(500).send({
        message: error.message
      });
      console.log("Transfer ", error)
    }
  }

  return { create }
}

const settle_auction = () => {
  create = (req, res) => {
    try {
      create_history(req.body.tokenId, AUCTION_SETTLE, req.body.owner, req.body.from, req.body.to);
      let cond = {
        tokenId: req.body.tokenId,
        owner: req.body.owner,
        status: 'create'
      }
      Auction.updateOne(cond, { $set: { status: "end" }}, { useFindAndModify: false })
      .then(data => {
        if (!data) {
          res.status(404).send();
        } else {
          res.send({ message: "Auction was end successfully." });
          create_history(req.body.tokenId, AUCTION_CANCEL, req.body.owner);
        } 
      })
      .catch(err => {
        res.status(500).send({
          message: "Error end auction with owner=" + req.body.owner
        });
      });
    } catch (error) {
      res.status(500).send({
        message: error.message
      });
      console.log("Settle Acution", error)
    }
  }
  return { create }
}

const mint = () => {
  create =(req, res) => {
    try {
      create_history(req.body.tokenId, MINT, req.body.owner);
      res.send({msg: "successfully"});
    } catch (error) {
      res.status(500).send({
        message: error.message
      });
      console.log("Mint ", error)
    }
  }

  return { create }
}

const update_price = () => {
  create = (req, res) => {
    try {
      create_history(req.body.tokenId, PRICE_UPDATED, req.body.owner, "", "", req.body.prevPrice, req.body.currPrice);
      res.send({msg: "successfully"});
    } catch (error) {
      res.status(500).send({
        message: error.message
      });
      console.log("Update Price ", error)
    }
  }

  return { create }
}

const add_follow = () => {
  create = (req, res) => {
    // Validate request
    if (!req.body.owner) {
      res.status(400).send({ message: "Content can not be empty!" });
      return;
    }
  
    // Create a profile
    const follow = new Follow({
      owner: req.body.owner,
      followAccount: req.body.followAccount,
      state: "true"
    });
  
    // Save profile in the database
    follow
      .save(follow)
      .then(data => {
        res.send(data);
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while creating the profile."
        });
      });

    };

  findAll = (req, res) => {
      const owner = req.body.owner;
      const cond = {
        owner: owner,
        state: 'true'
      }

      Follow.find(cond)
      .then(data => {
        res.send({"followInfos":data});
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while retrieving Bids."
        });
      });
    };

    return { create, findAll }
}

const getNfts = () => {
  get = (req, res) => {
    const offset = Number(req.query.offset)
    const limit = Number(req.query.limit)
    NftItem.find({}, {tokenId: true}).skip(offset).limit(limit)
    .then(data => {
      NftItem.estimatedDocumentCount()
      .then(count => {
        res.send({total: count, "nftIDs": data})
      })
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while getting NFTs"
      })
    })
  }

  return { get }
}

const getOwners = () => {
  get = (req, res) => {
    Owner.find({})
    .then(data => {
      Owner.estimatedDocumentCount()
      .then(count => {
        res.send({total: count, "owners": data})
      })
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while getting owners"
      })
    })
  }

  return { get }
}

const getNftsByAccount = () => {
  get = (req, res) => {
    const offset = Number(req.query.offset)
    const limit = Number(req.query.limit)
    const account = req.params.account.toLowerCase()
    Owner.find({ownerOf: account})
    .then(total => {
      Owner.find({ownerOf: account}, {tokenId: true}).skip(offset).limit(limit)
      .then((data) => {
        res.send({total: total.length, "nftIDs": data})
      })
    })
  }

  return { get }
}
module.exports = { db_profile, db_auction, db_bid, db_history, get_hot_auction, transfer, settle_auction, mint, update_price, add_follow, getNfts, getOwners, getNftsByAccount }
