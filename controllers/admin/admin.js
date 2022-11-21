const { check, validationResult } = require("express-validator");
const appModel = require("../../models/dbconnection");
const CryptoJS = require("crypto-js");

module.exports = {
    home: function(req, res, next) {
        if (req.session.admin_user_id) {
            res.redirect("/admin/dashboard");
        } else {
            res.render("admin/index.ejs", { message: "", errors: {}, email: "" });
        }
    },
    
    authenticate: async function(req, res, next) {
        var post = req.body;
        if (post) {
            await check("email").isEmail().withMessage("Email is required.").run(req);
            await check("password")
                .isLength({ min: 5 })
                .withMessage("Password is required and must be at least 5 chars long.")
                .run(req);

            let errors = validationResult(req);

            if (errors.isEmpty()) {
                let email = req.body.email;
                let password = req.body.password;

                let sql = "SELECT * FROM admin WHERE `email` = ?";
                let searchArray = [email];
                appModel.query(sql, searchArray, function(err, rows) {
                    if (rows && rows.length == 0) {
                        res.render("admin/index.ejs", { message: "A valid email is required", errors: {}, email: email,});
                    } else {
                        password = CryptoJS.HmacMD5(password, "ilovescotchscotchyscotchscotch" ).toString();
                        if (password !== rows[0].password) {
                            res.render("admin/index.ejs", {
                                message: "Oops! Wrong password.",
                                errors: {},
                                email: email,
                            });
                        } 
                        else {
                            var usersmac = CryptoJS.HmacMD5(rows[0].id, "ilovescotchscotchyscotchscotch").toString();
                            req.session.admin_user_usersmac = usersmac;
                            req.session.admin_user_id = rows[0].id;
                            req.session.admin_user_name = rows[0].first_name + " " + rows[0].last_name;
                            req.session.admin_user_email = rows[0].email;
                            res.redirect("/admin/users");
                        }
                    }
                });
            } else {
                res.render("admin/index.ejs", {
                    message: "Oops! Wrong email or password.",
                    errors: {},
                    email: post.email,
                });
            }
        } else {
            res.redirect("/admin/users");
        }
    },
    dashboard: function(req, res, next){    
        var message='';
        if(req.session.success) {
            message=req.session.success;
            delete req.session.success;
        }                 
        res.render('admin/dashboard.ejs',{ message: message});
    },  
    index: function(req, res, next){   
        var message='';
        if(req.session.success) {
            message=req.session.success;
            delete req.session.success;
        } 
        var error='';
        if(req.session.error) {
            error=req.session.error;
            delete req.session.error;
        }             
        res.render('admin/admin-users.ejs',{ success: message,errors: error});
    },
    edit: function(req, res, next){          
        var getId = req.params.id;        
        if(typeof getId!=='undefined') {
             var qd = "SELECT * FROM admin WHERE id='"+getId+"'";  
            appModel.query(qd, function(err, rows) {
                if(rows) {
                    res.render('admin/add-admin-user.ejs',{admin_id:getId,message: '',errors: {},result:rows[0]});
                }
                else {
                    res.redirect('/admin/admin-users');
                }      
            });
        }
        else {
            res.render('admin/add-admin-user.ejs',{ admin_id:'',message: '',errors: {},result:{}});
        }       
    },
    delete: function(req, res, next){          
        var getId = req.params.id;        
        if(typeof getId!=='undefined') {
            var qd = "SELECT id FROM admin WHERE id='"+getId+"'";  
            appModel.query(qd, function(err, rows) {               
                if(rows) {
                    var isMaster = rows.is_master;
                    if(isMaster=='1') {
                        req.session.error="Sorry! you can not delete default admin.";
                        res.redirect('/admin/admin-users');
                    }
                    else {
                        var qd = "DELETE FROM admin WHERE id='"+getId+"'";
                        appModel.query(qd,function(err, rows) {
                            if(err) {
                                req.session.error="Sorry! user not deleted. Please try again";
                                res.redirect('/admin/admin-users');
                            }
                            else {
                                req.session.success="User deleted successfully";
                                res.redirect('/admin/admin-users');
                            }
                        });
                    }
                }   
            });
        }
        else {
            res.redirect('/admin/admin-users');
        }       
    },
    change_admin_password: async function(req, res, next) {
        let getId = req.params.id;   
        let post = req.body;       
        if(typeof post!=='undefined' && post.submit=='Submit') {
            //VALIDATE FORM
            //await check('old_password').isLength({ min: 3 }).withMessage('Old password is required.').run(req);
            await check('new_password').isLength({ min: 3 }).withMessage('Password is required and must be at least 3 chars long.').run(req);
            await check('password_again').isLength({ min: 3 }).withMessage('Re Password is required.').run(req);
            await check('password_again').custom((value, { req }) => {
              if (value !== req.body.new_password) {
                throw new Error('Password confirmation does not match password');
              }
              // Indicates the success of this synchronous custom validator
              return true;
            });
            var errors = req.validationErrors();           
            if(!errors){
                var qd = "SELECT password FROM admin WHERE id='"+getId+"'";                            
                appModel.query(qd,function(err, rows) {
                    if(err) {
                        res.render('admin/change-admin-password.ejs',{message: "Sorry! record not updated. Please try again.",errors: {}});
                    }
                    else {         
                        /*password = CryptoJS.HmacMD5(post.old_password, "ilovescotchscotchyscotchscotch").toString();                  
                        if (password!== rows[0].password) {
                            res.render('admin/change-admin-password.ejs',{ message: 'Oops! Wrong old password.',errors: {}});         
                        }
                        else {*/
                            post.password = CryptoJS.HmacMD5(post.new_password, "ilovescotchscotchyscotchscotch").toString();
                            var q = "UPDATE admin SET password='"+ post.password+"' WHERE id='"+getId+"'";
                            settingsModel.query(q,function(err, rows) {
                                if(err) {
                                   res.render('admin/change-admin-password.ejs',{ message: 'Sorry! record not updated. Please try again.',errors: {}});
                                }
                                else {
                                    req.session.success="Password updated successfully.";
                                    res.redirect('/admin/dashboard');
                                }
                            });    
                        //}
                    }
                });
            }
            else {
               res.render('admin/change-admin-password.ejs',{message: '',errors: errors});
            }
        }
        else {
             res.render('admin/change-admin-password.ejs',{message: '',errors: {}});
        }
        
    },
    update: async function(req, res, next) {
        var getId = req.params.id;
        var post = req.body;
        if(post && post.admin_user=='add_update') {
            if(typeof getId!=='undefined') { 
                //VALIDATE FORM
                await check('email').isEmail().withMessage('Email is required.').run(req);
                await check('first_name').isLength({ min: 2 }).withMessage('First name is required and must be at least 2 chars long.').run(req);
                await check('last_name').isLength({ min: 2 }).withMessage('Last name is required and must be at least 2 chars long.').run(req);
                await check('role').isLength({ min: 1 }).withMessage('Please select admin user role').run(req);
                let errors = validationResult(req);
                if (errors.isEmpty()) {
                    //CHECK FOR DUPLICATE
                    var qd = "SELECT id FROM admin WHERE email='"+post.email+"' AND id!='"+getId+"'";                    
                    appModel.query(qd,function(err, rows) {
                        if(rows.length>0) {
                            res.render('admin/add-admin-user.ejs',{admin_id:getId, message: 'Sorry! Email Address already exists in our database. Please enter another Email Address.',errors: {},result:post});
                        }
                        else {
                            var q = "UPDATE admin SET email='"+post.email+"',first_name='"+post.first_name+"',last_name='"+post.last_name+"',phone_number='"+post.phone_number+"', role='"+post.role+"', status='"+post.status+"',updateAt=now() WHERE id='"+getId+"'";
                            appModel.query(q,function(err, rows) {
                                if(err) {
                                   res.render('admin/add-admin-user.ejs',{ admin_id:getId,message: 'Sorry! record not updated. Please try again.',errors: {},result:post});
                                }
                                else {
                                    req.session.success="Record updated successfully.";
                                    res.redirect('/admin/admin-users');
                                }
                            });
                        }
                    });                    
                    
                }
                else {     
                    res.render('admin/add-admin-user.ejs',{admin_id:getId, message: '',errors: errors,result:post});
                }    
            }
            else {                
                //VALIDATE FORM
                await check('email').isEmail().withMessage('Email is required.').run(req);
                await check('first_name').isLength({ min: 2 }).withMessage('First name is required and must be at least 2 chars long.').run(req);
                await check('last_name').isLength({ min: 2 }).withMessage('Last name is required and must be at least 2 chars long.').run(req);
                await check('role').isLength({ min: 1 }).withMessage('Please select admin user role').run(req);
                await check('password').isLength({ min: 3 }).withMessage('Password is required.').run(req);
                await check('password_again').isLength({ min: 3 }).withMessage('Confirm Password is required.').run(req);
                await check('password_again').custom((value, { req }) => {
                  if (value !== req.body.password) {
                    throw new Error('Password confirmation does not match password');
                  }
                  // Indicates the success of this synchronous custom validator
                  return true;
                });
                let errors = validationResult(req);
                if (errors.isEmpty()) {
                    var qd = "SELECT id FROM admin WHERE email='"+post.email+"'";
                    appModel.query(qd,function(err, rows) {
                        if(rows.length>0) {
                            res.render('admin/add-admin-user.ejs',{admin_id:'', message: 'Sorry! Email Address already exists in our database. Please enter another Email Address.',errors: {},result:post});
                        }
                        else {
                            post.password = CryptoJS.HmacMD5(post.password, "ilovescotchscotchyscotchscotch").toString();
                            var q = "INSERT INTO admin SET email='"+post.email+"',password='"+post.password+"',first_name='"+post.first_name+"',last_name='"+post.last_name+"',phone_number='"+post.phone_number+"', role='"+post.role+"', status='"+post.status+"',createdAt=now(),updateAt=now()";
                            appModel.query(q,function(err, rows) {
                                if(err) {
                                   res.render('admin/add-admin-user.ejs',{admin_id:'', message: 'Sorry! record not added. Please try again.',errors: {},result:post});
                                }
                                else {
                                    req.session.success="Admin user Created successfully.";
                                    res.redirect('/admin/admin-users');
                                }
                            });
                        }
                    });
                }
                else {
                    res.render('admin/add-admin-user.ejs',{ admin_id:'',message: '',errors: errors,result:post});
                }
            }
        }
        else {
            res.redirect('/admin/admin-users');
        }
    },
};