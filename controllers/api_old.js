const { check, validationResult } = require("express-validator");
const appModel = require("../models/dbconnection");
const CryptoJS = require("crypto-js");

module.exports = {

    agent_login: async function (req, res, next) {

        let post = req.body;
        if (typeof (post) !== 'undefined' && typeof (post.email) !== 'undefined' && post.email !== '' && typeof (post.password) !== 'undefined' && post.password !== '') {
            let email = post.email;
            let password = post.password;
            let searchSql = "SELECT * FROM users WHERE `email` = ?";
            appModel.query(searchSql, [email], async function (err, rows) {
                if (err) {
                    res.send({ "status": "error", "message": err });
                } else {
                    if (rows && rows.length == 0) {
                        res.send({ "status": "error", "message": "Email and password is not correct" });
                    } else {
                        password = CryptoJS.HmacMD5(password, "ilovescotchscotchyscotchscotch").toString();
                        console.log("password=== ", password)
                        if (password !== rows[0].password) {
                            res.send({ "status": "error", "message": "Password is not correct" });
                        } else {
                            res.send({ "status": "ok", "message": "Success", data: rows[0] });
                        }
                    }

                }
            });
        } else {
            res.send({ "status": "error", "message": "Please enter valid information" });
        }

    },
    User_verification: function (req, res, next) {
        console.log("id =", req.params.id);
        var id = req.params.id;

        if (typeof (id) !== 'undefined') {
            let sqlQuery = "SELECT * FROM users Where id = ? AND status = ?";
            appModel.query(sqlQuery, [id, 0], function (err, result) {
                if (err) {
                    res.json({ 'status': 'error', 'message': err });
                }
                else {
                    if (result && result.length == 0) {
                        res.json({ 'status': 'error', 'message': "Unknown user" });
                    }
                    else {
                        
                        // let enc = encrypt(id.toString());
                        let url = "http://3.220.88.200:8009/api/agentId/" + id;
                        res.status(200).json({ 'status': 'success', 'url': url });
                    }
                }
            })
        }
        else {
            res.json({ "status": "error", "message": "Invalid" });
        }
    },

    getAgent_by_id: async (req, res, next) => {
        console.log('encrypt_id =', req.params.getAgent_id);
        var encrypt_id = req.params.getAgent_id;

        if (typeof (encrypt_id) !== "undefined") {           
           
            let sqlQuery = "SELECT id,first_name,last_name,email,phone_number,state,licence_expire,licence_photo,status,photo,createdAt,updatedAt FROM users Where id = ? and status = ?";
            
            appModel.query(sqlQuery, [encrypt_id, 0], (err, result) => {
                if (err) {
                    res.json({ 'status': 'error', 'message': err });
                }
                else {
                    if (result && result.length == 0) {
                        res.json({ 'status': 'error', 'message': "Unknown user" });
                    }
                    else {
                        res.status(200).json({ 'status': 'success', 'data': result });
                    }
                }
            });
        }
        else {
            res.json({ "status": "error", "message": "Invalid" });
        }
    },

    updateAgentPassword: async (req, res, next) => {
        console.log(req.params.getAgent_id);
       
        var getAgent_id = req.params.getAgent_id
        if (typeof (getAgent_id) !== "undefined") {
            
            if (typeof (req.body.password) !== "undefined" && typeof (req.body.confirm_password) !== "undefined" && req.body.password !=="" && req.body.confirm_password !== "" ) {
                if (req.body.password == req.body.confirm_password) {
                    
                    let pwd = req.body.password;
                    let id = getAgent_id;
                    
                    let password = CryptoJS.HmacMD5(pwd, "ilovescotchscotchyscotchscotch" ).toString();
                    console.log('password',password); 
                    let sqlQuery ="UPDATE users SET status = '1', password = '"+password+"' WHERE id = '"+id+"'";                  
                    
                    appModel.query(sqlQuery, (err, result) => {
                        if (err) {
                            res.json({ 'status': 'error', 'message': err });
                        }
                        else {
                            if (result && result.length == 0) {
                                res.json({ 'status': 'error', 'message': 'Unknown user' });
                            }
                            else {
             

                                let sqlQuery_2 ="SELECT id,first_name,last_name,email,phone_number,state,licence_expire,licence_photo,status,photo,createdAt,updatedAt from users where id ='"+id+"'";
                                // console.log(sqlQuery_2);
                                appModel.query(sqlQuery_2,(err1,data)=>{
                                    if(err1)
                                    {
                                        res.json({ 'status': 'error', 'message': err1 });
                                    }
                                    else{
                                        res.status(200).json({ 'status': 'success','message':'Password Updated Successfully','data': data });
                                    }
                                })
                               
                            }
                        }
                    });
                }
                else {
                    res.json({ "status": "error", "message": "Password and Confirm password not Matched" });
                }

            }
            else {
                res.json({ "status": "error", "message": "Please fill password and confirm password" });
            }
        }
        else {
            res.json({ "status": "error", "message": "Invalid" });
        }
    }
};