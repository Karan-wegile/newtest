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
    res.render("admin/tags.ejs", { success: message, errors: error });
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
          let qd = "SELECT * FROM tags WHERE id=?";
          let placeholder = [getId];
          appModel.query(qd, placeholder, function (err, rows) {
            if (rows) {
              myArray = rows[0].state.split("");
              function arrayRemove(arr, value) {
                return arr.filter(function (ele) {
                  return ele != value;
                });
              }
              var result = arrayRemove(myArray, ",");
              newvalue = result.map((id) => ({ id }));
              res.render("admin/edit-tags.ejs", {
                user_id: getId,
                message: "",
                errors: {},
                result: rows[0],
                states: states,
                obj3: newvalue,
              });
            } else {
              res.redirect("/admin/setup/tags");
            }
          });
        } else {
          res.render("admin/edit-tags.ejs", {
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
      var qd = "SELECT id FROM tags WHERE id='" + getId + "'";
      appModel.query(qd, function (err, rows) {
        if (rows) {
          let qd = "DELETE FROM tags WHERE id=?";
          let placeholder = [getId];
          appModel.query(qd, placeholder, function (err, rows) {
            if (err) {
              console.log(err);
              req.session.error = "Sorry! tag not deleted. Please try again";
              res.redirect("/admin/setup/tags");
            } else {
              req.session.success = "Tag deleted successfully";
              res.redirect("/admin/setup/tags");
            }
          });
        }
      });
    } else {
      res.redirect("/admin/setup/tags");
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
            .withMessage(
              "Tag Name is required and must be at least 2 chars long."
            )
            .run(req);

          await check("status")
            .isLength({ min: 1 })
            .withMessage("Please select status")
            .run(req);

          let errors = validationResult(req);
          if (errors.isEmpty()) {
            var qd = "SELECT id FROM tags WHERE name='" + post.name + "'";
            appModel.query(qd, function (err, rows) {
              if (rows.length > 0) {
                res.render("admin/edit-tags.ejs", {
                  user_id: "",
                  message:
                    "Sorry! tag  already exists in our database. Please enter another tag.",
                  errors: {},
                  result: post,
                });
              } else {
                let q =
                  "INSERT INTO tags SET name='" +
                  post.name +
                  "',status='" +
                  post.status +
                  "'";

                appModel.query(q, function (err, rows) {
                  if (err) {
                    console.log(err);
                    res.render("admin/edit-tags.ejs", {
                      user_id: "",
                      message: "Sorry! record not added. Please try again.",
                      errors: {},
                      result: post,
                      states: states,
                    });
                  } else {
                    req.session.success = "New tag Added successfully.";
                    res.redirect("/admin/setup/tags");
                  }
                });
              }
            });
          } else {
            res.render("admin/edit-tags.ejs", {
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
            .withMessage(
              "Tag name is required and must be at least 2 chars long."
            )
            .run(req);

          await check("status")
            .isLength({ min: 1 })
            .withMessage("Please select status")
            .run(req);
          let errors = validationResult(req);
          if (errors.isEmpty()) {
            //CHECK FOR DUPLICATE
            let qd = "SELECT id FROM tags WHERE name=? AND id!=?";
            let placeholder = [post.name, getId];
            appModel.query(qd, placeholder, function (err, rows) {
              if (rows.length > 0) {
                res.render("admin/edit-tags.ejs", {
                  user_id: getId,
                  message:
                    "Sorry! tag exists in our database. Please enter another tag.",
                  errors: {},
                  result: post,
                });
              } else {
                let q =
                  "UPDATE tags SET name='" +
                  post.name +
                  "',status='" +
                  post.status +
                  "' WHERE id='" +
                  getId +
                  "' ";

                appModel.query(q, function (err, rows) {
                  if (err) {
                    res.render("admin/edit-tags.ejs", {
                      user_id: getId,
                      message: "Sorry! record not updated. Please try again.",
                      errors: {},
                      result: post,
                    });
                  } else {
                    req.session.success = "tag updated successfully.";
                    res.redirect("/admin/setup/tags");
                  }
                });
              }
            });
          } else {
            res.render("admin/edit-tags.ejs", {
              user_id: getId,
              message: "",
              errors: errors,
              result: post,
            });
          }
        }
      }
    } else {
      res.redirect("/admin/setup/tags");
    }
  },
};
