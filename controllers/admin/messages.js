// const bcrypt = require("bcrypt-nodejs");
const CryptoJS = require("crypto-js");
const appModel = require("../../models/dbconnection");
const { check, validationResult } = require("express-validator");
const { selectFields } = require("express-validator/src/select-fields");

module.exports = {
  
  index: function (req, res, next) {
    let message = "";
    if (req.session.success) {
      message = req.session.success;
      delete req.session.success;
    }
    let error = "";
    if (req.session.error) {
      error = req.session.error;
      delete req.session.error;
    }
    res.render("admin/messages.ejs", { success: message, errors: error });
  },


  edit: async function (req, res) {
    let getId = req.params.id;
    var message;
    let q = "select * from messages";
    appModel.query(q, function (err, rows) {
      if (err) {
        throw err;
      } else {
        message = rows;
        if (typeof getId !== "undefined") {
          let qd = "SELECT * FROM messages WHERE id=?";
          let placeholder = [getId];
          appModel.query(qd, placeholder, function (err, rows) {
            if (rows) {
              res.render("admin/edit-messages.ejs", {
                user_id: getId,
                message: "",
                errors: {},
                result: rows[0],
                oppmessage: message,
              });
            } else {
              res.redirect("/admin/setup/messages");
            }
          });
        } else {
          res.render("admin/edit-messages.ejs", {
            user_id: "",
            message: "",
            errors: {},
            result: {},
            oppmessage: message,
          });
        }
      }
    });
  },

  delete: function (req, res, next) {
    let getId = req.params.id;
    if (typeof getId !== "undefined") {
      var qd = "SELECT id FROM messages WHERE id='" + getId + "'";
      appModel.query(qd, function (err, rows) {
        if (rows) {
          let qd = "DELETE FROM messages WHERE id=?";
          let placeholder = [getId];
          appModel.query(qd, placeholder, function (err, rows) {
            if (err) {
              req.session.error = "Sorry! messages not deleted. Please try again";
              res.redirect("/admin/setup/messages");
            } else {
              req.session.success = "messages deleted successfully";
              res.redirect("/admin/setup/messages");
            }
          });
        }
      });
    } else {
      res.redirect("/admin/setup/messages");
    }
  },

  // update: async function (req, res, next) {
  //   let addId = req.params.id;
  //   let getId = req.query.id;

  //   let post = req.body;
  //   if (post) {
  //     if (!getId) {
  //       if (typeof addId == "undefined") {
  //         //VALIDATE FORM
  //         await check("message")
  //           .isLength({ min: 2 })
  //           .withMessage("Message is required and must be at least 2 chars long.")
  //           .run(req);

  //         let errors = validationResult(req);
  //         if (errors.isEmpty()) {
  //           var qd = "SELECT id FROM messages WHERE message='" + post.message + "'";
  //           appModel.query(qd, function (err, rows) {
  //             if (rows.length > 0) {
  //               res.render("admin/edit-messages.ejs", {
  //                 user_id: "",
  //                 message:
  //                   "Sorry! message already exists in our database. Please enter another message.",
  //                 errors: {},
  //                 result: post,
  //               });
  //             } else {
  //               let q =
  //                 "INSERT INTO messages SET message='" +
  //                 post.message +
  //                 "'";

  //               appModel.query(q, function (err, rows) {
  //                 if (err) {
  //                   console.log(err);
  //                   res.render("admin/edit-messages.ejs", {
  //                     user_id: "",
  //                     message: "Sorry! record not added. Please try again.",
  //                     errors: {},
  //                     result: post,
  //                   });
  //                 } else {
  //                   req.session.success = "New Message Added successfully.";
  //                   res.redirect("/admin/setup/messages");
  //                 }
  //               });
  //             }
  //           });
  //         } else {
  //           res.render("admin/edit-messages.ejs", {
  //             user_id: "",
  //             message: "",
  //             errors: errors,
  //             result: post,
  //           });
  //         }
  //       }
  //     } else {
  //       if (getId) {
  //         //VALIDATE FORM
  //         console.log(addId, "adddid3");
  //         console.log(getId, "getid3");
  //         await check("message")
  //           .isLength({ min: 2 })
  //           .withMessage("Message is required and must be at least 2 chars long.")
  //           .run(req);

  //         let errors = validationResult(req);
  //         if (errors.isEmpty()) {
  //           //CHECK FOR DUPLICATE
  //           let qd = "SELECT id FROM messages WHERE message=? AND id!=?";
  //           let placeholder = [post.message, getId];
  //           appModel.query(qd, placeholder, function (err, rows) {
  //             if (rows.length > 0) {
  //               res.render("admin/edit-messages.ejs", {
  //                 user_id: getId,
  //                 message:
  //                   "Sorry! Message  already exists in our database. Please enter another Message.",
  //                 errors: {},
  //                 result: post,
  //               });
  //             } else {
  //               let q =
  //                 "UPDATE messages SET message='" +
  //                 post.message +
  //                 "' WHERE id='" +
  //                 getId +
  //                 "' ";

  //               appModel.query(q, function (err, rows) {
  //                 if (err) {
  //                   res.render("admin/edit-messages.ejs", {
  //                     user_id: getId,
  //                     message: "Sorry! record not updated. Please try again.",
  //                     errors: {},
  //                     result: post,
  //                   });
  //                 } else {
  //                   req.session.success = "Message updated successfully.";
  //                   res.redirect("/admin/setup/messages");
  //                 }
  //               });
  //             }
  //           });
  //         } else {
  //           res.render("admin/edit-messages.ejs", {
  //             user_id: getId,
  //             message: "",
  //             errors: errors,
  //             result: post,
  //           });
  //         }
  //       }
  //     }
  //   } else {
  //     res.redirect("/admin/setup/messages");
  //   }
  // },

  update: async function (req, res, next) {
    let getId = req.params.id;
    var message;
    let post = req.body;
    if (post) {

      if (!getId) {
        //VALIDATE FORM
        await check("opportunities")
          .isLength({ min: 2 })
          .withMessage("Opportunities is required and must be at least 2 chars long.")
          .run(req);

        await check("message_type")
          .isLength({ min: 1 })
          .withMessage("Please select message_type")
          .run(req);

        await check("message")
          .isLength({ min: 1 })
          .withMessage("Message is required and must be at least 2 chars long.")
          .run(req);

        let errors = validationResult(req);
        if (errors.isEmpty()) {
          let q = "select * from messages";
          appModel.query(q, function (err, rows) {
            if (err) {
              throw err;
            } else {
              message = rows;
              let q = "INSERT INTO messages SET opportunities='" + post.opportunities + "', message_type='" + post.message_type + "' , message ='" + post.message + "' ";
              appModel.query(q, function (err, rows) {
                if (err) {
                  res.render("admin/edit-messages.ejs", {
                    user_id: "",
                    message: "Sorry! record not added. Please try again.",
                    errors: {},
                    result: post,
                    oppmessage: message,
                  });
                } else {
                  req.session.success = "New Message Added successfully.";
                  res.redirect("/admin/setup/messages");
                }
              });
            }
          })
        } else {
          let q = "select * from messages";
          appModel.query(q, function (err, rows) {
            if (err) {
              throw err;
            } else {
              message = rows;
              res.render("admin/edit-messages.ejs", {
                user_id: "",
                message: "Error While Uploading Please Check Input Fields",
                errors: errors,
                result: post,
                oppmessage: message,
              });
            }
          })
        }
      } else {
        //VALIDATE FORM
        await check("opportunities")
          .isLength({ min: 2 })
          .withMessage("Campaign is required and must be at least 2 chars long.")
          .run(req);

        await check("message_type")
          .isLength({ min: 1 })
          .withMessage("Please select Message Type")
          .run(req);

        await check("message")
          .isLength({ min: 1 })
          .withMessage("Message is required and must be at least 2 chars long.")
          .run(req);

        let errors = validationResult(req);
        if (errors.isEmpty()) {
          //CHECK FOR DUPLICATE

          let q = "select * from messages";
          appModel.query(q, function (err, rows) {
            if (err) {
              throw err;
            } else {
              message = rows;

              let q =
                "UPDATE messages SET opportunities='" +
                post.opportunities +
                "', message_type='" +
                post.message_type +
                "', message='" +
                post.message +
                "' WHERE id='" +
                getId +
                "' ";

              appModel.query(q, function (err, rows) {
                if (err) {
                  res.render("admin/edit-messages.ejs", {
                    user_id: getId,
                    message: "Sorry! record not updated. Please try again.",
                    errors: {},
                    result: post,
                    oppmessage: message,
                  });
                } else {
                  req.session.success = "Messages updated successfully.";
                  res.redirect("/admin/setup/messages");
                }
              });
            }
          })

        } else {
          let q = "select * from messages";
          appModel.query(q, function (err, rows) {
            if (err) {
              throw err;
            } else {
              message = rows;
              res.render("admin/edit-campaign.ejs", {
                user_id: getId,
                message: "",
                errors: errors,
                result: post,
                oppmessage: message,
              });
            }
          })
        }
      }
    } else {
      res.redirect("/admin/setup/messages");
    }
  },
};
