const { check, validationResult } = require("express-validator");
const appModel = require("../../models/dbconnection");
const CryptoJS = require("crypto-js");

module.exports = {
  index: async function (req, res, next) {
    var message = "";
    if (req.session.success) {
      message = req.session.success;
      delete req.session.success;
    }
    var error = "";
    if (req.session.error) {
      error = req.session.error;
      delete req.session.error;
    }
    var states;
    var contacts;
    let qd = "select * from users";
    let q = "select * from states";
    appModel.query(q, function (err, rows) {
      if (err) {
        console.log(err, "index states");
        throw err;
      } else {
        states = rows;
        appModel.query(qd, function (err, row) {
          if (err) {
            console.log(err, "index users");
            throw err;
          } else {
            users = row;
            res.render("admin/opportunities.ejs", {
              user_id: "",
              message: message,
              states: states,
              users: users,
              success: message,
              errors: error,
            });
          }
        });
      }
    });
  },
  edit: async function (req, res) {
    let getId = req.query.id;
    console.log(getId, "getid");
    var states;
    let q = "select * from states";
    appModel.query(q, function (err, rows) {
      if (err) {
        console.log(err, "edit states");
        throw err;
      } else {
        states = rows;
        if (typeof getId !== "undefined") {
          let qd = "SELECT * FROM opportunities WHERE id=?";
          let placeholder = [getId];
          appModel.query(qd, placeholder, function (err, rows) {
            if (rows) {
              res.render("admin/edit-opportunities.ejs", {
                user_id: getId,
                message: "",
                errors: {},
                result: rows[0],
                states: states,
              });
            } else {
              res.redirect("/admin/opportunities");
            }
          });
        } else {
          res.render("admin/edit-opportunities.ejs", {
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
  update: async function (req, res, next) {
    let addId = req.params.id;
    let getId = req.query.id;
    let post = req.body;
    console.log(getId, "getid");
    console.log(addId, "addid");
    console.log(post, "post");
    
    if (!getId) {
      if (typeof addId == "undefined") {
        //VALIDATE FORM
        let errors = validationResult(req);
        if (errors.isEmpty()) {
          var qd =
            "SELECT id FROM opportunities WHERE name='" +
            post.opportunityname +
            "'";
          var states;
          let q = "select * from states";
          appModel.query(q, function (err, row) {
            if (err) {
              console.log(err, "states");
              throw err;
            } else {
              states = row;
              appModel.query(qd, function (err, rows) {
                if (rows.length > 0) {
                  console.log("error already exist");
                  res.render("admin/opportunities.ejs", {
                    user_id: "",
                    message:
                      "Sorry! Name already exists in our database. Please enter another Name.",
                    errors:
                      "Sorry! Name already exists in our database. Please enter another Name.",
                    success: "",
                    result: post,
                    states: states,
                  });
                } else {
                      console.log("insert");
                      let contactsave =
                        "INSERT INTO contacts SET first_name='" +
                        post.first_name +
                        "',last_name='" +
                        post.last_name +
                        "',email='"+
                        post.email +  
                        "',state='" +
                        post.state +
                        "',address='" +
                        post.address +
                        "',city='" +
                        post.city +
                        "',post_code='"+
                        post.post_code+
                        "',user_fid='" +
                        post.agent_id +
                        "',phone_number='" +
                        post.code +
                        "',contact_type='1' ";
                      appModel.query(contactsave, function (err, contact) {
                        if (err) {
                          console.log(err);
                        } else {
                          console.log(contact, "contact");
                          var contactid =   "SELECT * FROM contacts WHERE email='" + post.email +  "' ";
                          appModel.query(contactid, function (err, rows) {
                            if (err) {
                              console.log(err, "contacatid");
                            } else {
                              let q =   "INSERT INTO opportunities SET name='" +
                              post.opportunityname +
                              "',pipeline='" +
                              post.pipeline +
                              "',opp_stage='" +
                              post.selectstage +
                              "',lead_value='" +
                              post.leadvalue +
                              "',owner='" +
                              post.owner +
                              "',source='" +
                              post.source +
                              "',contact_id='" +
                              rows[0].id +
                              "',agent_id='"+
                              rows[0].user_fid +
                              "'  ";
                              appModel.query(q, function (err, rows) {
                                if (err) {
                                  console.log(err, "errorS aprt");
                                  res.render("admin/opportunities.ejs", {
                                    user_id: "",
                                    message:
                                      "Sorry! record not added. Please try again.",
                                    errors:
                                      "Sorry! record not added. Please try again.",
                                    result: post,
                                    success: "",
                                    
                                  });
                                } else {
                                  res.redirect("/admin/opportunities");
                                }
                              });
                            }
                          });
                        }
                      });
                }
              });
            }
          });
        } else {
          console.log(errors, "errorrs insert");
          throw errors;
        }
      }
    } else {
      if (getId) {
        console.log(post, "postdataa");
        //update form
        let errors = validationResult(req);
        if (errors.isEmpty()) {
          var qd ="SELECT id FROM opportunities WHERE name='" + post.opportunityname + "' AND id!='"+post.id+"'";
         
          var states;
          let q = "select * from states";
          appModel.query(q, function (err, row) {
            if (err) {
              console.log(err, "states");
              throw err;
            } else {
              states = row;
              appModel.query(qd, function (err, rows) {
                if (rows.length > 0) {
                  console.log("error already exist");
                  res.render("admin/opportunities.ejs", {
                    user_id: "",
                    message:
                      "Sorry! Name already exists in our database. Please enter another Name.",
                    errors:
                      "Sorry! Name already exists in our database. Please enter another Name.",
                    success: "",
                    result: post,
                    states: states,
                  });
                }else {
                  console.log(post, "postrr");
                    console.log("update");
                      let qv =
                        "UPDATE  opportunities SET name='" +
                        post.opportunityname +
                        "',pipeline='" +
                        post.pipeline +
                        "',opp_stage='" +
                        post.selectstage +
                        "',lead_value='" +
                        post.leadvalue +
                        "',owner='" +
                        post.owner +
                        "',source='" +
                        post.source +
                        "' WHERE id='" +
                        getId +
                        "' ";

                      appModel.query(qv, function (err, rows) {
                        if (err) {
                          console.log(err, "errorS aprt");
                          res.render("admin/opportunities.ejs", {
                            user_id: "",
                            message:
                              "Sorry! record not update. Please try again.",
                            errors:
                              "Sorry! record not update. Please try again.",
                            result: post,
                            success: "",
                            states: states,
                          });
                        } else {
                          res.redirect("/admin/opportunities");
                        }
                      });
                }
              });
            }
          });
        } else {
          console.log(errors, "errors update");
          throw errors;
        }
      }
    }
  },
  usersAction: async function (req, res, next) {
    const { type, data } = req.body;
    console.log(type, "useractionlog");
    if (type == "Delete") {
      data.forEach((item) => {
        let q = `DELETE FROM opportunities WHERE id= ${item}`;
        appModel.query(q, function (err, rows) {
          return next();
        });
      });
    }
  },
  update_state:async function(req,res){
    var data = req.query;
    console.log(req.query,'ajax data')
    let q = "SELECT * FROM users WHERE state='" + data.abbrev +  "' ";
    appModel.query(q,function(err,rows){
      if(err){
        console.log(err,'errororrro')
      }else{
        res.json(rows)
      }
    })
  },
};
