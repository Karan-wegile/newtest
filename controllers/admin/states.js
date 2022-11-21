// const bcrypt = require("bcrypt-nodejs");
const CryptoJS = require("crypto-js");
const appModel = require("../../models/dbconnection");
const { check, validationResult } = require("express-validator");

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
    res.render("admin/states.ejs", { success: message, errors: error });
  },
  edit: async function (req, res) {
    let getId = req.query.id;

    var states;
    let q = "select * from states";
    appModel.query(q, function (err, rows) {
      if (err) {
        throw err;
      } else {
        states = rows;
        if (typeof getId !== "undefined") {
          let qd = "SELECT * FROM states WHERE id=?";
          let placeholder = [getId];
          appModel.query(qd, placeholder, function (err, rows) {
            if (rows) {
              res.render("admin/edit-state.ejs", {
                user_id: getId,
                message: "",
                errors: {},
                result: rows[0],
              });
            } else {
              res.redirect("/admin/setup/states");
            }
          });
        } else {
          res.render("admin/edit-state.ejs", {
            user_id: "",
            message: "",
            errors: {},
            result: {},
            states: states,
          });
        }
      }
    });
  },
  delete: function (req, res, next) {
    let getId = req.params.id;
    if (typeof getId !== "undefined") {
      var qd = "SELECT id FROM states WHERE id='" + getId + "'";
      appModel.query(qd, function (err, rows) {
        if (rows) {
          let qd = "DELETE FROM states WHERE id=?";
          let placeholder = [getId];
          appModel.query(qd, placeholder, function (err, rows) {
            if (err) {
              console.log(err);
              req.session.error = "Sorry! state not deleted. Please try again";
              res.redirect("/admin/setup/states");
            } else {
              req.session.success = "State deleted successfully";
              res.redirect("/admin/setup/states");
            }
          });
        }
      });
    } else {
      res.redirect("/admin/setup/states");
    }
  },
  update: async function (req, res, next) {
    let addId = req.params.id;
    let getId = req.query.id;
    let post = req.body;
    if (post) {
      if (!getId) {
        if (typeof addId == "undefined") {
          //VALIDATE FORM
          await check("name")
            .isLength({ min: 2 })
            .withMessage("Name is required and must be at least 2 chars long.")
            .run(req);
       

          await check("status")
            .isLength({ min: 1 })
            .withMessage("Please select status")
            .run(req);

          let errors = validationResult(req);
          if (errors.isEmpty()) {
            var qd = "SELECT id FROM states WHERE name='" + post.name + "'";
            appModel.query(qd, function (err, rows) {
              if (rows.length > 0) {
                res.render("admin/edit-state.ejs", {
                  user_id: "",
                  message:
                    "Sorry! Name already exists in our database. Please enter another Name.",
                  errors: {},
                  result: post,
                });
              } else {
                let q =
                  "INSERT INTO states SET name='" +
                  post.name +
                  "',status='" +
                  post.status +
                  "' ";

                appModel.query(q, function (err, rows) {
                  if (err) {
                    console.log(err);
                    res.render("admin/edit-state.ejs", {
                      user_id: "",
                      message: "Sorry! record not added. Please try again.",
                      errors: {},
                      result: post,
                    });
                  } else {
                    req.session.success = "New State Added successfully.";
                    res.redirect("/admin/setup/states");
                  }
                });
              }
            });
          } else {
            res.render("admin/edit-state.ejs", {
              user_id: "",
              message: "",
              errors: errors,
              result: post,
            });
          }
        }
      } else {
        if (getId) {
          //VALIDATE FORM
          await check("name")
            .isLength({ min: 2 })
            .withMessage("Name is required and must be at least 2 chars long.")
            .run(req);
         

          await check("status")
            .isLength({ min: 1 })
            .withMessage("Please select status ")
            .run(req);
          let errors = validationResult(req);
          if (errors.isEmpty()) {
            //CHECK FOR DUPLICATE
            let qd = "SELECT id FROM states WHERE name=? AND id!=?";
            let placeholder = [post.name, getId];
            appModel.query(qd, placeholder, function (err, rows) {
              if (rows.length > 0) {
                res.render("admin/edit-state.ejs", {
                  user_id: getId,
                  message:
                    "Sorry! Name  already exists in our database. Please enter another Name.",
                  errors: {},
                  result: post,
                });
              } else {
                let q =
                  "UPDATE states SET name='" +
                  post.name +
                
                  "', status='" +
                  post.status +
                  "' WHERE id='" +
                  getId +
                  "' ";

                appModel.query(q, function (err, rows) {
                  if (err) {
                    res.render("admin/edit-state.ejs", {
                      user_id: getId,
                      message: "Sorry! record not updated. Please try again.",
                      errors: {},
                      result: post,
                    });
                  } else {
                    req.session.success = "State updated successfully.";
                    res.redirect("/admin/setup/states");
                  }
                });
              }
            });
          } else {
            res.render("admin/edit-states.ejs", {
              user_id: getId,
              message: "",
              errors: errors,
              result: post,
            });
          }
        }
      }
    } else {
      res.redirect("/admin/setup/states");
    }
  },
};
