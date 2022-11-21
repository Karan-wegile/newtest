// const bcrypt = require("bcrypt-nodejs");
const CryptoJS = require("crypto-js");
const appModel = require("../../models/dbconnection");
const { check, validationResult } = require("express-validator");
const multer = require("multer");
const path = require("path");
const storage3 = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/uploads/licence_photo')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "-" + Date.now() + "-" + file.originalname)
    }
});
const upload3 = multer({ storage: storage3 });
module.exports = {
    index: function(req, res, next) {
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
        res.render("admin/users.ejs", { success: message, errors: error });
    },
    edit: async function(req, res) {
        let getId = req.query.id;

        var states;
        let q = "select * from states";
        appModel.query(q, function(err, rows) {
            if (err) {
                throw err;
            } else {
                states = rows;

                if (typeof getId !== "undefined") {
                    let qd = "SELECT * FROM users WHERE id=?";
                    let placeholder = [getId];
                    appModel.query(qd, placeholder, function(err, rows) {
                        if (rows) {
                            newvalue = rows[0].state.split(",");

                            /*function arrayRemove(arr, value) {
                                return arr.filter(function(ele) {
                                    return ele != value;
                                });
                            }

                            var result = arrayRemove(myArray, ",");
                            newvalue = result.map((state_abbrev) => ({ state_abbrev }));*/
                            res.render("admin/edit-user.ejs", {
                                user_id: getId,
                                message: "",
                                errors: {},
                                status: rows[0].status,
                                result: rows[0],
                                states: states,
                                obj3: newvalue,
                            });
                        } else {
                            res.redirect("/admin/users");
                        }
                    });
                } else {
                    res.render("admin/edit-user.ejs", {
                        user_id: "",
                        message: "",
                        status: 0,
                        errors: {},
                        result: {},
                        states: states,
                    });
                }
            }
        });
    },
    delete: function(req, res, next) {
        let getId = req.params.id;
        if (typeof getId !== "undefined") {
            var qd = "SELECT id FROM users WHERE id='" + getId + "'";
            appModel.query(qd, function(err, rows) {
                if (rows) {
                    let qd = "DELETE FROM users WHERE id=?";
                    let placeholder = [getId];
                    appModel.query(qd, placeholder, function(err, rows) {
                        if (err) {
                            console.log(err);
                            req.session.error = "Sorry! user not deleted. Please try again";
                            res.redirect("/admin/users");
                        } else {
                            req.session.success = "User deleted successfully";
                            res.redirect("/admin/users");
                        }
                    });
                }
            });
        } else {
            res.redirect("/admin/users");
        }
    },

     update: async function(req, res, next) {
        console.log(req.body);

        let addId = req.params.id;
        let getId = req.query.id;
        let post = req.body;

        if (post) {
            if (!getId) {
                if (typeof addId == "undefined") {
                    //VALIDATE FORM
                    await check("first_name").isLength({ min: 2 }).withMessage("First name is required and must be at least 2 chars long.").run(req);
                    await check("email").isEmail().withMessage("Email is required.").run(req);
                    await check("phone_number").isLength({ min: 8, max: 15 }).withMessage("phone_number is required.").run(req);
                    let errors = validationResult(req);
                    if (errors.isEmpty()) {
                        var states;
                        let q = "select * from states";
                        appModel.query(q, function(err, row) {
                            if (err) {
                                throw err;
                            } else {
                                states = row;
                                var qd = "SELECT id FROM users WHERE email='" + post.email + "'";
                                appModel.query(qd, function(err, rows) {
                                    if (err) {
                                        throw err;
                                    } else {
                                        newvalue = post.state.toString().split(",");
                                        console.log(newvalue,'dd')
                                        if (rows.length > 0) {

                                            res.render("admin/edit-user.ejs", {
                                                user_id: "",
                                                message: "Sorry! Email Address already exists in our database. Please enter another Email Address.",
                                                errors: {},
                                                result: post,
                                                status: 0,
                                                states: states,
                                                obj3: newvalue
                                            });
                                        } else {
                                            let password = CryptoJS.HmacMD5("crm@#$123", "ilovescotchscotchyscotchscotch").toString();
                                            let q = "INSERT INTO users SET first_name='" +
                                                post.first_name +
                                                "', last_name='" +
                                                post.last_name +
                                                "', email='" +
                                                post.email +
                                                "', phone_number='" +
                                                post.code +
                                                "', state='" +
                                                post.state.toString().replace(/\s*,\s*/g, ",") +
                                                "',password='" +
                                                password +
                                                "',licence_no='" +
                                                post.licence_no +
                                                "',licence_expire='" +
                                                post.licence_expire +
                                                "',licence_photo='" +
                                                post.updatephoto +
                                                "',photo='" +
                                                post.update_p_photo +
                                                "' ";

                                            appModel.query(q, function(err, rows) {
                                                newvalue = post.state.toString().split(",");
                                                if (err) {
                                                    console.log(err);
                                                    res.render("admin/edit-user.ejs", {
                                                        user_id: "",
                                                        message: "Sorry! record not added. Please try again.",
                                                        errors: {},
                                                        result: post,
                                                        status: 0,
                                                        states: states,
                                                        obj3: newvalue
                                                    });
                                                } else {

                                                    let counter = 0;
                                                    if (typeof(post.state)!=='undefined' && post.state.length > 0) {
                                                        for (let s = 0; s < post.state.length; s++) {
                                                            if (s !== '') {
                                                                let userStates = "INSERT INTO user_selected_states SET user_id=?, state_abbrev=?,createdAt=now()";
                                                                let placeholderArray = [rows.insertId, post.state[s]];
                                                                appModel.query(userStates, placeholderArray, async function(err, rows) {
                                                                    counter++;
                                                                    if (counter >= post.state.length) {

                                                                                                                                            
                                                                        
                                                                              
                                                                        req.session.success = "Invite has been sent";
                                                                        res.redirect("/admin/users");
                                                                    }
                                                                });
                                                            }
                                                        }
                                                    }
                                                    else {
                                                      req.session.success = "Invite has been sent";
                                                      res.redirect("/admin/users");
                                                    }
                                                }
                                            });
                                        }
                                    }
                                });
                            }
                        });
                    } else {
                        var states;
                        let q = "select * from states";
                        appModel.query(q, function(err, row) {
                            if (err) {
                                throw err;
                            } else {
                                states = row;
                                res.render("admin/edit-user.ejs", {
                                    user_id: "",
                                    message: "",
                                    errors: errors,
                                    result: post,
                                    status: post.status,
                                    states: states,
                                });
                            }
                        });
                    }
                }
            } else {
                if (getId) {
                    //VALIDATE FORM
                    await check("first_name").isLength({ min: 2 }).withMessage("First name is required and must be at least 2 chars long.").run(req);
                    await check("last_name").isLength({ min: 2 }).withMessage("Last name is required and must be at least 2 chars long.").run(req);
                    await check("phone_number").isLength({ min: 8 }).withMessage("phone_number is required.").run(req);

                    let errors = validationResult(req);
                    console.log("errors", errors)
                    if (errors.isEmpty()) {
                        var states;
                        let q = "select * from states";
                        appModel.query(q, function(err, row) {
                            if (err) {
                                console.log(err, "err update states");
                                throw err;
                            } else {
                                states = row;
                                //CHECK FOR DUPLICATE
                                let qd = "SELECT id FROM users WHERE email=? AND id!=?";
                                let placeholder = [post.email, getId];
                                appModel.query(qd, placeholder, function(err, rows) {
                                    if (err) {
                                        throw err;
                                    }
                                    if (rows.length > 0) {
                                        newvalue = post.state.toString().split(",");

                                        /*function arrayRemove(arr, value) {
                                            return arr.filter(function(ele) {
                                                return ele != value;
                                            });
                                        }

                                        var result = arrayRemove(myArray, ",");
                                        newvalue = result.map((state_abbrev) => ({ state_abbrev }));*/
                                        res.render("admin/edit-user.ejs", {
                                            user_id: getId,
                                            message: "Sorry! Email Address already exists in our database. Please enter another Email Address.",
                                            errors: {},
                                            result: post,
                                            status: post.status,
                                            states: states,
                                            obj3: newvalue

                                        });
                                    } else {
                                        if (post.licence_photo == "") {
                                            post.licence_photo = post.updatephoto;
                                        }
                                        if (post.photo == "") {
                                            post.photo = post.update_p_photo;
                                        }
                                        post.state = post.state;
                                      
                                        let q = "UPDATE users SET first_name='" +
                                            post.first_name +
                                            "', last_name='" +
                                            post.last_name +
                                            "', phone_number='" +
                                            post.code +
                                            "',state='" +
                                            post.state.toString().replace(/\s*,\s*/g, ",") +
                                          
                                            "', licence_no='" +
                                            post.licence_no +
                                            "',licence_expire='" +
                                            post.licence_expire +
                                            "',licence_photo='" +
                                            post.updatephoto +
                                                "',photo='" +
                                                post.update_p_photo +
                                            "'  WHERE id='" +
                                            getId +
                                            "' ";

                                        appModel.query(q, function(err, rows) {
                                            if (err) {
                                                console.log(err)
                                                /*myArray = post.state

                                                function arrayRemove(arr, value) {
                                                    return arr.filter(function(ele) {
                                                        return ele != value;
                                                    });
                                                }

                                                var result = arrayRemove(myArray, ",");
                                                newvalue = result.map((id) => ({ id }));*/
                                                newvalue = post.state.toString().split(",");
                                                res.render("admin/edit-user.ejs", {
                                                    user_id: getId,
                                                    message: "Sorry! record not updated. Please try again.",
                                                    errors: {},
                                                    result: post,
                                                    status: post.status,
                                                    states: states,
                                                    obj3: newvalue,
                                                }); 
                                            } else {
                                                let counter = 0;
                                                let delUserStates = "DELETE FROM user_selected_states WHERE user_id=?";
                                                appModel.query(delUserStates, [getId], function(err1, rows1) {
                                                  if (typeof(post.state)!=='undefined' && post.state.length > 0) {
                                                      for (let s = 0; s < post.state.length; s++) {
                                                          if (s !== '') {
                                                              let userStates = "INSERT INTO user_selected_states SET user_id=?, state_abbrev=?,createdAt=now()";
                                                              let placeholderArray = [getId, post.state[s]];
                                                              appModel.query(userStates, placeholderArray, function(err, rows) {
                                                                  counter++;
                                                                  if (counter >= post.state.length) {
                                                                      req.session.success = "Agent updated successfully";
                                                                      res.redirect("/admin/users");
                                                                  }
                                                              });
                                                          }
                                                      }
                                                  }
                                                  else {
                                                    req.session.success = "Agent updated successfully";
                                                    res.redirect("/admin/users");
                                                  }

                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    } else {

                        var states;
                        let q = "select * from states";
                        appModel.query(q, function(err, row) {
                            if (err) {
                                throw err;
                            } else {
                                states = row;
                                res.render("admin/edit-user.ejs", {
                                    user_id: getId,
                                    message: "something went wrong",
                                    errors: errors,
                                    result: post,
                                    status: post.status,
                                    states: states,
                                    obj3: {}

                                });
                            }
                        });
                    }
                }
            }
        } else {
            res.redirect("/admin/users");
        }
    },
    change_password: async function(req, res, next) {
        let getId = req.params.id;
        let post = req.body;
        if (typeof post !== "undefined" && post.submit == "Submit") {
            //VALIDATE FORM

            //req.assert('password_again', 'Passwords do not match').equals(req.body.new_password);

            await check("new_password")
                .isLength({ min: 3 })
                .withMessage("New password is required.")
                .run(req);
            //await check('password_again').isLength({ min: 3 }).withMessage('Confirm Password is required.').run(req);
            await check("password_again").custom((value, { req }) => {
                if (value !== req.body.new_password) {
                    throw new Error("Password confirmation does not match password");
                }
                // Indicates the success of this synchronous custom validator
                return true;
            });

            let errors = req.validationErrors();
            if (!errors) {
                let qd = "SELECT password FROM users WHERE id=?";
                let placeholder = [getId];
                adminModel.query(qd, placeholder, function(err, rows) {
                    if (err) {
                        res.render("admin/change-password.ejs", {
                            message: "Sorry! record not updated. Please try again.",
                            errors: {},
                        });
                    } else {
                        // post.password = bcrypt.hashSync(post.new_password, null, null); // use the generateHash function in our user model
                        post.password = CryptoJS.HmacMD5(
                            post.new_password,
                            "ilovescotchscotchyscotchscotch"
                        ).toString();

                        var q = "UPDATE users SET password=? WHERE id=?";
                        let updatePlaceholder = [post.password, getId];
                        settingsModel.query(q, updatePlaceholder, function(err, rows) {
                            if (err) {
                                res.render("admin/change-password.ejs", {
                                    message: "Sorry! record not updated. Please try again.",
                                    errors: {},
                                });
                            } else {
                                req.session.success = "Password updated successfully.";
                                res.redirect("/admin/users");
                            }
                        });
                    }
                });
            } else {
                res.render("admin/change-password.ejs", {
                    message: "",
                    errors: errors,
                });
            }
        } else {
            res.render("admin/change-password.ejs", { message: "", errors: {} });
        }
    },
    usersAction: async function(req, res, next) {
        const { type, data } = req.body;

        if (type == "Activate") {
            data.forEach((item) => {
                let q = `UPDATE users SET status = '1' WHERE id = ${item}`;
                appModel.query(q, function(err, rows) {
                    return next();
                });
            });
        } else if (type == "Archive") {
            data.forEach((item) => {
                let q = `UPDATE users SET status = '2' WHERE id = ${item}`;
                appModel.query(q, function(err, rows) {
                    return next();
                });
            });
        } else if (type == "Delete") {
            data.forEach((item) => {
                let q = `DELETE FROM users WHERE id= ${item}`;
                appModel.query(q, function(err, rows) {
                    return next();
                });
            });
        }
    },
};  
