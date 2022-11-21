const { check, validationResult } = require("express-validator");
const appModel = require("../models/dbconnection");
const CryptoJS = require("crypto-js");
const { async } = require("q");

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
        var id = req.params.id;
        if (typeof (id) !== 'undefined') {
            let sqlQuery = "SELECT * FROM users Where id = ? AND status = ?";
            appModel.query(sqlQuery, [id, 0], function (err, result) {
                if (err) {
                    res.json({ 'status': 'error', 'message': err });
                } else {
                    if (result && result.length == 0) {
                        res.json({ 'status': 'error', 'message': "Unknown user" });
                    } else {

                        // let enc = encrypt(id.toString());                      
                        let url = "http://3.220.88.200:8009/api/agentId/" + id;
                        res.status(200).json({ 'status': 'success', 'url': url });
                    }
                }
            })
        } else {
            res.json({ "status": "error", "message": "Invalid" });
        }
    },

    getAgent_by_id: async (req, res, next) => {
        var encrypt_id = req.params.getAgent_id;
        if (typeof (encrypt_id) !== "undefined") {
            let sqlQuery = 'SELECT id,first_name,last_name,email,phone_number,state, licence_no, licence_expire,licence_photo,status,photo, DATE_FORMAT(createdAt,"%W, %M %d %Y") as createdAt,updatedAt FROM users Where id = ? and status = ?';
            appModel.query(sqlQuery, [encrypt_id, 0], (err, result) => {
                if (err) {
                    res.json({ 'status': 'error', 'message': err });
                } else {
                    if (result && result.length == 0) {
                        res.json({ 'status': 'error', 'message': "Unknown user" });
                    } else {
                        res.status(200).json({ 'status': 'success', 'data': result });
                    }
                }
            });
        } else {
            res.json({ "status": "error", "message": "Invalid" });
        }
    },

    updateAgentPassword: async (req, res, next) => {
        var getAgent_id = req.params.getAgent_id
        if (typeof (getAgent_id) !== "undefined") {
            if (typeof (req.body.password) !== "undefined" && typeof (req.body.confirm_password) !== "undefined" && req.body.password !== "" && req.body.confirm_password !== "") {
                if (req.body.password == req.body.confirm_password) {
                    let pwd = req.body.password;
                    let id = getAgent_id;
                    let password = CryptoJS.HmacMD5(pwd, "ilovescotchscotchyscotchscotch").toString();
                    let sqlQuery = "UPDATE users SET status =?, password = ? WHERE id = ?";
                    appModel.query(sqlQuery, [1, password, id], (err, result) => {
                        if (err) {
                            res.json({ 'status': 'error', 'message': err });
                        } else {
                            if (result && result.length == 0) {
                                res.json({ 'status': 'error', 'message': 'Unknown user' });
                            } else {

                                let sqlQuery_2 = "SELECT id,first_name,last_name,email,phone_number,state,licence_expire,licence_photo,status,photo,createdAt,updatedAt from users where id ='" + id + "'";
                                // console.log(sqlQuery_2);
                                appModel.query(sqlQuery_2, (err1, data) => {
                                    if (err1) {
                                        res.json({ 'status': 'error', 'message': err1 });
                                    } else {
                                        res.status(200).json({ 'status': 'success', 'message': 'Password Updated Successfully', 'data': data });
                                    }
                                })

                            }
                        }
                    });
                } else {
                    res.json({ "status": "error", "message": "Password and Confirm password not Matched" });
                }
            } else {
                res.json({ "status": "error", "message": "Please fill password and confirm password" });
            }
        } else {
            res.json({ "status": "error", "message": "Invalid" });
        }
    },

    edit_profile: async (req, res, next) => {
        var id = req.params.id;
        if (typeof (id) !== "undefined") {
            let sqlQuery = "SELECT id,first_name,last_name,email,phone_number,state,licence_no, licence_expire,licence_photo,status,photo,createdAt,updatedAt FROM users Where id = ? and status = 1";
            appModel.query(sqlQuery, [id], (err, result) => {
                if (err) {
                    res.json({ 'status': 'error', 'message': err });
                } else {
                    if (result && result.length == 0) {
                        res.json({ 'status': 'error', 'message': "Unknown user" });
                    } else {
                        res.status(200).json({ 'status': 'success', 'data': result[0] });
                    }
                }
            });
        } else {
            res.json({ "status": "error", "message": "Invalid" });
        }
    },

    get_states: async (req, res, next) => {
        let sqlQuery = "SELECT abbrev, name from states WHERE status=1";
        appModel.query(sqlQuery, (err, result) => {
            if (err) {
                res.json({ 'status': 'error', 'message': err });
            } else {
                if (result && result.length == 0) {
                    res.json({ 'status': 'error', 'message': "Unknown user" });
                } else {
                    res.status(200).json({ 'status': 'success', 'data': result });
                }
            }
        });
    },


    getConversations: async (req, res, next) => {
        let data = req.body;
        if (typeof (data) !== 'undefined' && typeof (data.agentId) !== 'undefined' && data.agentId !== '') {
            let sqlQuery = "SELECT u.first_name, u.last_name, u.email, u.phone_number, u.state, u.address, u.tags, u.contact_type, con.contact_id, con.conversation_type, con.conversation_text, con.posted_by, CONCAT(a.first_name,' ',a.last_name) as by_agent_name, DATE_FORMAT(con.createdAt, '%d/%b %l:%i %p') as createdAt from conversations as con INNER JOIN contacts as u on con.contact_id=u.id INNER JOIN users as a on con.agent_id=a.id WHERE u.contact_type IN (1,3) AND con.agent_id=?  AND con.id in (select max(id) from conversations WHERE agent_id=? group by contact_id) ORDER BY con.id DESC";
            appModel.query(sqlQuery, [data.agentId, data.agentId], (err, result) => {
                if (err) {
                    res.json({ 'status': 'error', 'message': err });
                }
                else {
                    if (result && result.length == 0) {
                        res.json({ 'status': 'error', 'message': "Unknown user" });
                    } else {
                        res.status(200).json({ 'status': 'success', 'data': result });
                    }
                }
            });
        }
        else {
            res.json({ 'status': 'error', 'message': "invalid request" });
        }

    },

    getConversation_for_one_contact: async (req, res, next) => {
        let data = req.body;
        if (typeof (data) !== 'undefined' && typeof (data.agent_id) !== 'undefined' && data.agent_id !== '' && typeof (data.contact_id) !== 'undefined' && data.contact_id !== '') {
            let sqlQuery = "SELECT u.first_name, u.last_name, u.email, u.phone_number, u.state, u.address,  con.conversation_type, con.conversation_text, con.posted_by, CONCAT(a.first_name,' ',a.last_name) as by_agent_name, DATE_FORMAT(con.createdAt, '%d/%b %l:%i %p') as createdAt from conversations as con INNER JOIN contacts as u on con.contact_id=u.id INNER JOIN users as a on con.agent_id=a.id WHERE con.agent_id=? AND con.contact_id=? ORDER BY con.id ASC";
            appModel.query(sqlQuery, [data.agent_id, data.contact_id], (err, result) => {
                if (err) {
                    res.json({ 'status': 'error', 'message': err });
                }
                else {
                    if (result && result.length == 0) {
                        res.json({ 'status': 'error', 'message': "Unknown user" });
                    } else {
                        res.status(200).json({ 'status': 'success', 'data': result });
                    }
                }
            });
        }
        else {
            res.json({ 'status': 'error', 'message': "invalid request" });
        }
    },

    send_message: async (req, res, next) => {
        let data = req.body;
        if (typeof (data) !== 'undefined' && typeof (data.agent_id) !== 'undefined' && data.agent_id !== '' && typeof (data.contact_id) !== 'undefined' && data.contact_id !== '' && typeof (data.conversation_text) !== 'undefined' && data.conversation_text !== '' && typeof (data.conversation_type) !== 'undefined' && data.conversation_type !== '') {
            let insertSql = "INSERT INTO conversations SET agent_id=?, contact_id=?, conversation_type=?, conversation_text=?, posted_by=?, createdAt=now()";
            appModel.query(insertSql, [data.agent_id, data.contact_id, data.conversation_type, data.conversation_text, data.posted_by], (err, rows) => {
                if (err) {
                    res.json({ 'status': 'error', 'message': err });
                }
                else {
                    let sqlQuery = "SELECT u.first_name, u.last_name, u.email, u.phone_number, u.state, u.tags, u.contact_type, u.address,  con.conversation_type, con.conversation_text, con.posted_by, CONCAT(a.first_name,' ',a.last_name) as by_agent_name, DATE_FORMAT(con.createdAt, '%d/%b %l:%i %p') as createdAt from conversations as con LEFT JOIN contacts as u on con.contact_id=u.id INNER JOIN users as a on con.agent_id=a.id WHERE con.id=?";
                    appModel.query(sqlQuery, [rows.insertId], (err, result) => {
                        if (err) {
                            res.json({ 'status': 'error', 'message': err });
                        }
                        else {
                            if (result && result.length == 0) {
                                res.json({ 'status': 'error', 'message': "Unknown user" });
                            } else {
                                res.status(200).json({ 'status': 'success', 'data': result[0] });
                            }
                        }
                    });
                }
            });
        }
        else {
            res.json({ 'status': 'error', 'message': "invalid request" });
        }
    },


    update_profile: async (req, res, next) => {
        var photo, licence_photo;
        var imgName = req.files
        if (req.files.length > 0) {
            imgName.forEach(e => {
                if (e.fieldname == 'photo') {
                    photo = e.filename;
                }
                if (e.fieldname == 'licence_photo') {
                    licence_photo = e.filename;
                }
            });
        }

        var getid = req.params.id
        if (typeof (getid) !== "undefined") {
            await check("first_name").isLength({ min: 2 }).withMessage("First name is required and must be at least 2 chars long.").run(req);
            await check("phone").isLength({ min: 8, max: 15 }).withMessage("phone_number is required.").run(req);
            let errors = validationResult(req);
            if (errors.isEmpty()) {
                var states;
                let q = "SELECT * FROM states";
                appModel.query(q, function (err, row) {
                    if (err) {
                        res.json({ 'status': 'error', 'message': err });
                    } else {
                        states = row;
                        var qd = "SELECT id FROM users WHERE id ='" + req.params.id + "'";
                        appModel.query(qd, function (err, rows) {
                            if (err) {
                                res.json({ 'status': 'error', 'message': err });
                            } else {
                                if (rows.length > 0) {
                                    let photo1 = (typeof (photo) !== 'undefined') ? photo : '';
                                    let licence_photo1 = (typeof (licence_photo) !== 'undefined') ? licence_photo : '';
                                    let qd2 = "UPDATE users SET first_name = ?,last_name = ?,phone_number = ?,state = ?,licence_no = ?,licence_expire = ?,licence_photo=?,photo=?, updatedAt=now() WHERE id = ?";
                                    let body = req.body;
                                    let array_data = [body.first_name, body.last_name, body.phone, body.state, body.licence_no, body.licence_expire, licence_photo1, photo1, getid];
                                    appModel.query(qd2, array_data, function (err, rows) {
                                        if (err) {
                                            res.json({ 'status': 'error', 'message': err });
                                        } else {
                                            let sqlQuery = "SELECT id,first_name,last_name,email,phone_number,state,licence_expire,licence_photo,status,photo,createdAt,updatedAt FROM users Where id = ? and status = ?";
                                            appModel.query(sqlQuery, [getid, 1], (err, result) => {
                                                if (err) {
                                                    res.json({ 'status': 'error', 'message': err });
                                                } else {
                                                    if (result && result.length == 0) {
                                                        res.json({ 'status': 'error', 'message': "Unknown user" });
                                                    } else {
                                                        res.status(200).json({
                                                            'status': 'success',
                                                            'message': 'Profile Updated Successfully',
                                                            'data': result,
                                                            'states': states
                                                        });
                                                    }
                                                }
                                            });

                                        }
                                    });
                                } else {
                                    res.status(200).json({ 'status': 'success', 'message': 'No Record Found', 'states': states });
                                }
                            }
                        });
                    }
                });
            } else {
                res.json({ "status": "error", "message": errors });
            }
        } else {
            res.json({ "status": "error", "message": "User Undefined" });
        }
    },

    // update_user_profile update Without Upload Image
    update_user_profile: async (req, res, next) => {
        let file = req.files;
        let licence_photo = "";
        let photo = "";

        if (file.licence_photo) {
            licence_photo = file?.licence_photo[0]?.filename || null;
            if (file.photo) {
                photo = file?.photo[0]?.filename || null;
            }
        } else {
            if (file.photo) {
                photo = file?.photo[0]?.filename || null;
            }
        };

        var getid = req.params.id
        if (typeof (getid) !== "undefined") {
            await check("first_name").isLength({ min: 2 }).withMessage("First name is required and must be at least 2 chars long.").run(req);
            await check("last_name").isLength({ min: 2 }).withMessage("Last name is required and must be at least 2 chars long.").run(req);
            await check("phone").isLength({ min: 8, max: 15 }).withMessage("phone_number is required.").run(req);
            let errors = validationResult(req);

            if (errors.isEmpty()) {
                var states;
                let q = "SELECT * FROM states";
                appModel.query(q, function (err, row) {
                    if (err) {
                        res.json({ 'status': 'error', 'message': err });
                    } else {
                        states = row;
                        var qd = "SELECT id FROM users WHERE id ='" + req.params.id + "'";
                        appModel.query(qd, function (err, rows) {
                            if (err) {
                                res.json({ 'status': 'error', 'message': err });
                            } else {
                                if (rows.length > 0) {
                                    let qd2 = '';
                                    if (file.licence_photo) {
                                        let qdpho = req.body.photo;
                                        if (qdpho == 'null') {
                                            qd2 = "UPDATE users SET first_name = ?,last_name = ?,phone_number = ?,state = ?,licence_no = ?,licence_expire = ?,licence_photo = ?,photo = ? WHERE id = ?";
                                        } else {
                                            qd2 = "UPDATE users SET first_name = ?,last_name = ?,phone_number = ?,state = ?,licence_no = ?,licence_expire = ?,licence_photo = ? WHERE id = ?";
                                        };
                                        if (file.photo) {
                                            qd2 = "UPDATE users SET first_name = ?,last_name = ?,phone_number = ?,state = ?,licence_no = ?,licence_expire = ?,licence_photo = ?, photo = ? WHERE id = ?";
                                        }
                                    } else {
                                        if (file.photo) {
                                            let qdlic = req.body.licence_photo;
                                            if (qdlic == 'null') {
                                                qd2 = "UPDATE users SET first_name = ?,last_name = ?,phone_number = ?,state = ?,licence_no = ?,licence_expire = ?,licence_photo = ?,photo = ? WHERE id = ?";
                                            } else {
                                                qd2 = "UPDATE users SET first_name = ?,last_name = ?,phone_number = ?,state = ?,licence_no = ?,licence_expire = ?, photo = ? WHERE id = ?";
                                            };
                                        } else {
                                            let qdlic = req.body.licence_photo;
                                            let qdpho = req.body.photo;
                                            if (qdlic == 'null' || qdpho == 'null') {
                                                if (qdlic == 'null') {
                                                    qd2 = "UPDATE users SET first_name = ?,last_name = ?,phone_number = ?,state = ?,licence_no = ?,licence_expire = ?,licence_photo = ? WHERE id = ?"
                                                    if (qdpho == 'null') {
                                                        qd2 = "UPDATE users SET first_name = ?,last_name = ?,phone_number = ?,state = ?,licence_no = ?,licence_expire = ?,licence_photo = ?, photo = ? WHERE id = ?"
                                                    }
                                                } else {
                                                    qd2 = "UPDATE users SET first_name = ?,last_name = ?,phone_number = ?,state = ?,licence_no = ?,licence_expire = ?, photo = ? WHERE id = ?"
                                                }
                                            } else {
                                                qd2 = "UPDATE users SET first_name = ?,last_name = ?,phone_number = ?,state = ?,licence_no = ?,licence_expire = ? WHERE id = ?";
                                            };
                                        }
                                    }
                                    let body = req.body;
                                    let array_data = '';

                                    if (file.licence_photo) {
                                        let qdpho = req.body.photo;
                                        if (qdpho == 'null') {
                                            array_data = [body.first_name, body.last_name, body.phone, body.state, body.licence_no, body.licence_expire, licence_photo, null, getid];
                                        } else {
                                            array_data = [body.first_name, body.last_name, body.phone, body.state, body.licence_no, body.licence_expire, licence_photo, getid];
                                        };
                                        if (file.photo) {
                                            array_data = [body.first_name, body.last_name, body.phone, body.state, body.licence_no, body.licence_expire, licence_photo, photo, getid];
                                        }
                                    } else {
                                        if (file.photo) {
                                            let qdlic = req.body.licence_photo;
                                            if (qdlic == 'null') {
                                                array_data = [body.first_name, body.last_name, body.phone, body.state, body.licence_no, body.licence_expire, null, photo, getid];
                                            } else {
                                                array_data = [body.first_name, body.last_name, body.phone, body.state, body.licence_no, body.licence_expire, photo, getid];
                                            };
                                        } else {
                                            let qdlic = req.body.licence_photo;
                                            let qdpho = req.body.photo;
                                            if (qdlic == 'null' || qdpho == 'null') {
                                                if (qdlic == 'null') {
                                                    array_data = [body.first_name, body.last_name, body.phone, body.state, body.licence_no, body.licence_expire, null, getid];
                                                    if (qdpho == 'null') {
                                                        array_data = [body.first_name, body.last_name, body.phone, body.state, body.licence_no, body.licence_expire, null, null, getid];
                                                    }
                                                } else {
                                                    array_data = [body.first_name, body.last_name, body.phone, body.state, body.licence_no, body.licence_expire, null, getid];
                                                }
                                            } else {
                                                array_data = [body.first_name, body.last_name, body.phone, body.state, body.licence_no, body.licence_expire, getid];
                                            };
                                        }
                                    };

                                    appModel.query(qd2, array_data, function (err, rows) {
                                        if (err) {
                                            res.json({ 'status': 'error', 'message': err });
                                        } else {

                                            let sqlQuery = "SELECT id,first_name,last_name,email,phone_number,state,licence_expire,licence_photo,status,photo,createdAt,updatedAt FROM users Where id = ? and status = ?";

                                            appModel.query(sqlQuery, [getid, 1], (err, result) => {
                                                if (err) {

                                                    res.json({ 'status': 'error', 'message': err });
                                                } else {
                                                    if (result && result.length == 0) {
                                                        res.json({ 'status': 'error', 'message': "Unknown user" });
                                                    } else {
                                                        res.status(200).json({
                                                            'status': 'success',
                                                            'message': 'Profile Updated Successfully',
                                                            'data': result,
                                                            'states': states
                                                        });
                                                    }
                                                }
                                            });
                                        }
                                    });

                                } else {
                                    res.status(200).json({ 'status': 'success', 'message': 'No Record Found', 'states': states });
                                }
                            }
                        });
                    }
                });
            } else {
                res.json({ "status": "error", "message": errors });
            }
        } else {
            res.json({ "status": "error", "message": "User Undefined" });
        }
    },

    getContactByUserId: async (req, res, next) => {
        if (typeof (req.params.userId) !== 'undefined') {
            let sqlQuery = "SELECT id,first_name,last_name,email,licence_expire,phone_number,state,licence_expire FROM users Where id = '" + req.params.userId + "' AND status = 1";
            appModel.query(sqlQuery, (err, row) => {
                if (err) {
                    res.send({ 'status': 'error', 'message': err });
                } else {
                    if (row && row.length == 1) {
                        let sqlQuery2 = "SELECT * from contacts where user_fid = '" + req.params.userId + "' AND contact_type=1";
                        appModel.query(sqlQuery2, (err2, rows) => {
                            if (err2) {
                                res.send({ 'status': 'error', 'message': err2 });
                            } else {
                                if (rows && rows.length > 0) {
                                    // res.send({ "status": "ok", "message": "Success", 'user':row });
                                    res.send({ "status": "ok", "message": "Success", 'user': row, 'contact': rows });
                                } else {
                                    res.send({ 'status': 'error', 'message': "No contact", 'user': row });
                                }
                            }
                        })
                    } else {
                        res.send({ "status": "error", "message": "No User Records" });
                    }
                }
            })
        } else {
            res.send({ "status": "error", "message": "User undefined." });
        }
    },

    create_opportunity: async (req, res, next) => {
        let agentId = req.params.agentId
        let data = req.body;
        if (typeof (data) !== 'undefined' && typeof (data.email) !== 'undefined' && data.email !== '' && typeof (data.first_name) !== 'undefined' && data.first_name !== '' && typeof (data.last_name) !== 'undefined' && data.last_name !== '' && typeof (data.address) !== 'undefined' && data.address !== '' && typeof (data.city) !== 'undefined' && data.city !== '' && typeof (data.opportunity_name) !== 'undefined' && data.opportunity_name !== '' && typeof (data.phone) !== 'undefined' && data.phone !== '' && typeof (data.stage) !== 'undefined' && data.stage !== '' && typeof (data.state) !== 'undefined' && data.state !== '' && typeof (data.zip_code) !== 'undefined' && data.zip_code !== '' && typeof (data.status) !== 'undefined' && data.status !== '') {
            //CHECK EXISTING CONTACTS
            let sqlQuery ="SELECT id FROM contacts WHERE email=?";
            appModel.query(sqlQuery, [data.email], (err, result) => {
                if (err) {
                    res.json({ 'status': 'error', 'message': err });
                }
                else {
                    if(result && result.length>0) {
                        res.json({ 'status': 'error', 'message': "Contact already exists with this email address" });
                    }
                    else {
                        let insertSql = "INSERT INTO contacts SET email=?, first_name=?, last_name=?, phone_number=?, state=?, address=?, stage=?, city=?, post_code=?, user_fid=?, status=?, contact_type=?, created=now()";

                        appModel.query(insertSql, [data.email, data.first_name, data.last_name, data.phone, data.state, data.address, 'opportunity', data.city, data.zip_code, agentId, 1, 3 ], (err, rows) => {
                            if (err) {
                                res.json({ 'status': 'error', 'message': err });
                            }
                            else {
                                let insertSql = "INSERT INTO opportunities SET agent_id=?, name=?, pipeline=?, opp_stage=?, lead_value=?, contact_id=?,  status=?, createdAt=now(), updatedAt=now()";
                                let placeholder = [agentId, data.opportunity_name, data.pipeline, data.stage, data.lead_value, rows.insertId, data.status]
                                appModel.query(insertSql, placeholder, (err1, rows1) => {
                                    if (err1) {
                                        res.json({ 'status': 'error', 'message': err1 });
                                    }
                                    else {
                                        res.status(200).json({ 'status': 'success' });
                                    }
                                });
                            }
                        });
                    }
                }
            })
        }
        else {
            res.json({ 'status': 'error', 'message': "invalid request" });
        }
    },

    create_opportunity_from_task: async (req, res, next) => {
        let agentId = req.params.agentId
        let data = req.body;
        if (typeof (data) !== 'undefined' && typeof (data.contact_id) !== 'undefined' && data.contact_id !== '' && typeof (data.opportunity_name) !== 'undefined' && data.opportunity_name !== '' && typeof (data.stage) !== 'undefined' && data.stage !== '' && typeof (data.status) !== 'undefined' && data.status !== '') {

            //CHECK EXISTING CONTACTS
            let sqlQuery ="SELECT id FROM contacts WHERE email=?";
            appModel.query(sqlQuery, [data.email], (err, result) => {
                if (err) {
                    res.json({ 'status': 'error', 'message': err });
                }
                else {
                    if(result && result.length>0) {
                        res.json({ 'status': 'error', 'message': "Contact already exists with this email address" });
                    }
                    else {
                        let insertSql = "SELECT id FROM opportunities WHERE contact_id=?";

                        appModel.query(insertSql, [data.contact_id], (err, rows) => {
                            if (err) {
                                res.json({ 'status': 'error', 'message': err });
                            }
                            else {
                                if(rows && rows.length>0) {
                                    res.json({ 'status': 'error', 'message': "This user is already added in opportunity" });
                                }
                                else {
                                    let insertSql = "INSERT INTO opportunities SET agent_id=?, name=?, pipeline=?, opp_stage=?, lead_value=?, contact_id=?,  status=?, createdAt=now(), updatedAt=now()";
                                    let placeholder = [agentId, data.opportunity_name, data.pipeline, data.stage, data.lead_value, data.contact_id, data.status]
                                    appModel.query(insertSql, placeholder, (err1, rows1) => {
                                        if (err1) {
                                            res.json({ 'status': 'error', 'message': err1 });
                                        }
                                        else {
                                            //UPDATE CONTACT TYPE
                                            let updateSql ="UPDATE contacts SET contact_type=? WHERE id=?";
                                            appModel.query(updateSql, [3, data.contact_id], (err2, rows2) => {
                                            });
                                            res.status(200).json({ 'status': 'success' });
                                        }
                                    });
                                }
                                
                            }
                        });
                    }
                }
            });
        }
        else {
            res.json({ 'status': 'error', 'message': "invalid request" });
        }
    },


    move_contact_to_dnd: async (req, res, next) => {
        let agentId = req.params.agentId
        let data = req.body;
        if (typeof (data) !== 'undefined' && typeof (data.contact_id) !== 'undefined' && data.contact_id !== '' && typeof (data.action) !== 'undefined' && data.action == 'move_to_dnd') {
            //CHECK EXISTING CONTACTS
            let sqlQuery ="SELECT id FROM contacts WHERE id=?";
            appModel.query(sqlQuery, [data.contact_id], (err, result) => {
                if (err) {
                    res.json({ 'status': 'error', 'message': err });
                }
                else {
                    if(result && result.length==0) {
                        res.json({ 'status': 'error', 'message': "Contact not exists" });
                    }
                    else {
                        let updateSql = "UPDATE contacts SET contact_type=?, dnd_date=now() WHERE id=?";
                        let placeholder = [2, data.contact_id];
                        appModel.query(updateSql, placeholder, (err1, rows1) => {
                            if (err1) {
                                res.json({ 'status': 'error', 'message': err1 });
                            }
                            else {
                                res.status(200).json({ 'status': 'success' });
                            }
                        });
                    }
                }
            });
        }
        else {
            res.json({ 'status': 'error', 'message': "invalid request" });
        }
    },

    send_bulk_messages: async (req, res, next) => {
        let data = req.body;
        if (typeof (data) !== 'undefined' && typeof (data.agent_id) !== 'undefined' && data.agent_id !== '' && typeof (data.contact_ids) !== 'undefined' && data.contact_ids.length>0 && typeof (data.conversation_text) !== 'undefined' && data.conversation_text !== '' && typeof (data.conversation_type) !== 'undefined' && data.conversation_type !== '') {
            let counter =0 ;
            let contact_ids = data.contact_ids;
            for(let i=0;i<contact_ids.length;i++) {
                let insertSql = "INSERT INTO conversations SET agent_id=?, contact_id=?, conversation_type=?, conversation_text=?, posted_by=?, createdAt=now()";
                let placeholder = [data.agent_id, contact_ids[i], data.conversation_type, data.conversation_text, 'Agent'];
                appModel.query(insertSql, placeholder, (err1, rows1) => {
                    if (err1) {
                        counter++;
                        if(counter>=contact_ids.length) {
                            res.json({ 'status': 'error', 'message': err1 });
                        }
                    }
                    else {
                        counter++;
                        if(counter>=contact_ids.length) {
                            res.status(200).json({ 'status': 'success' });
                        }
                    }
                });
            }
        }
        else {
            res.json({ 'status': 'error', 'message': "invalid request" });
        }
    },


    group_contact_to_dnd: async (req, res, next) => {
        let agentId = req.params.agentId
        let data = req.body;
        if (typeof (data) !== 'undefined' && typeof (data.contact_ids) !== 'undefined' && data.contact_ids.length>0 && typeof (data.action) !== 'undefined' && data.action == 'move_to_dnd') {
            let counter =0 ;
            let contact_ids = data.contact_ids;
            for(let i=0;i<contact_ids.length;i++) {
                let updateSql = "UPDATE contacts SET contact_type=?, dnd_date=now() WHERE id=?";
                let placeholder = [2, contact_ids[i]];
                appModel.query(updateSql, placeholder, (err1, rows1) => {
                    if (err1) {
                        counter++;
                        if(counter>=contact_ids.length) {
                            res.json({ 'status': 'error', 'message': err1 });
                        }
                        
                    }
                    else {
                        counter++;
                        if(counter>=contact_ids.length) {
                            res.status(200).json({ 'status': 'success' });
                        }
                    }
                });
            }
        }
        else {
            res.json({ 'status': 'error', 'message': "invalid request" });
        }
    },

    update_user_tags: async (req, res, next) => {
        let agentId = req.params.agentId
        let data = req.body;
        if (typeof (data) !== 'undefined' && typeof (data.contact_id) !== 'undefined' && data.contact_id!=='' && typeof (data.tags) !== 'undefined' && data.tags!=='' && typeof (data.action) !== 'undefined' && data.action == 'update_user_tags') {
            let updateSql = "UPDATE contacts SET tags=? WHERE id=?";
            let placeholder = [data.tags, data.contact_id];
            appModel.query(updateSql, placeholder, (err1, rows1) => {
                if (err1) {
                    res.json({ 'status': 'error', 'message': err1 });
                    
                }
                else {
                    res.status(200).json({ 'status': 'success' });
                }
            });
        }
        else {
            res.json({ 'status': 'error', 'message': "invalid request" });
        }
    },


    update_opportunity_stages: async (req, res, next) => {
        let agentId = req.params.agentId
        let data = req.body;
        if (typeof (data) !== 'undefined' && typeof (data.opportunity_id) !== 'undefined' && data.opportunity_id!=='' && typeof (data.opp_stage) !== 'undefined' && data.opp_stage!=='' && typeof (data.action) !== 'undefined' && data.action == 'update_opportunity_stages') {
            let updateSql = "UPDATE opportunities SET opp_stage=? WHERE id=?";
            let placeholder = [data.opp_stage, data.opportunity_id];
            appModel.query(updateSql, placeholder, (err1, rows1) => {
                if (err1) {
                    res.json({ 'status': 'error', 'message': err1 });
                    
                }
                else {
                    let insertSql = "INSERT INTO conversations SET agent_id=?, contact_id=?, conversation_type=?, conversation_text=?, posted_by=?, createdAt=now()";
                    let message="Updated the stage to "+data.opp_stage;
                    let placeholder = [data.agent_id, data.contact_id, "Message", message, 'Agent'];
                    appModel.query(insertSql, placeholder, (err1, rows1) => {
                    });
                    res.status(200).json({ 'status': 'success' });
                }
            });
        }
        else {
            res.json({ 'status': 'error', 'message': "invalid request" });
        }
    },

    get_opportunities: async (req, res, next) => {
        let data = req.body;
        if (typeof (data) !== 'undefined' && typeof (data.agent_id) !== 'undefined' && data.agent_id !== '') {

            let searchSql = '';
            if (typeof (data.search_type) !== 'undefined' && data.search_type !== '') {
                if (data.search_type !== 'new') {
                    searchSql = " AND opp.opp_stage='" + data.search_type + "' ";
                }
            }
            let sqlQuery = "SELECT u.first_name, u.last_name, u.email, u.phone_number, u.state, u.address, opp.* from opportunities as opp INNER JOIN contacts as u on opp.contact_id=u.id WHERE opp.agent_id=? " + searchSql + " ORDER BY opp.id DESC";
            appModel.query(sqlQuery, [data.agent_id], (err, result) => {
                if (err) {
                    res.json({ 'status': 'error', 'message': err });
                }
                else {
                    if (result && result.length == 0) {
                        res.json({ 'status': 'success', 'message': "success", 'data': [] });
                    } else {
                        res.status(200).json({ 'status': 'success', 'data': result });
                    }
                }
            });
        }
        else {
            res.json({ 'status': 'error', 'message': "invalid request" });
        }
    },


    get_single_contact: async (req, res, next) => {
        let data = req.body;
        if (typeof (data) !== 'undefined' && typeof (data.agent_id) !== 'undefined' && data.agent_id !== '' && typeof (data.contact_id) !== 'undefined' && data.contact_id !== '') {
            let sqlQuery = "SELECT id, email, first_name, last_name, phone_number, state, address, stage, tags, city, post_code, campaign, DATE_FORMAT(follow_up_date, '%Y-%m-%d') as follow_up_date  from contacts WHERE id=? AND user_fid=?";
            appModel.query(sqlQuery, [data.contact_id, data.agent_id], (err, result) => {
                if (err) {
                    res.json({ 'status': 'error', 'message': err });
                }
                else {
                    if (result && result.length == 0) {
                        res.json({ 'status': 'error', 'message': "Unknown user" });
                    } else {
                        res.status(200).json({ 'status': 'success', 'data': result });
                    }
                }
            });
        }
        else {
            res.json({ 'status': 'error', 'message': "invalid request" });
        }
    },

    get_single_opportunities: async (req, res, next) => {
        let data = req.body;
        if (typeof (data) !== 'undefined' && typeof (data.opportunity_id) !== 'undefined' && data.opportunity_id !== '') {
            let sqlQuery = "SELECT u.first_name, u.last_name, u.email, u.phone_number, u.state, u.address, opp.* from opportunities as opp INNER JOIN contacts as u on opp.contact_id=u.id WHERE opp.id=?";
            appModel.query(sqlQuery, [data.opportunity_id], (err, result) => {
                if (err) {
                    res.json({ 'status': 'error', 'message': err });
                }
                else {
                    if (result && result.length == 0) {
                        res.json({ 'status': 'success', 'message': "success", 'data': [] });
                    } else {
                        res.status(200).json({ 'status': 'success', 'data': result });
                    }
                }
            });
        }
        else {
            res.json({ 'status': 'error', 'message': "invalid request" });
        }
    },

    create_new_note: async (req, res, next) => {
        let data = req.body;
        if (typeof (data) !== 'undefined' && typeof (data.agent_id) !== 'undefined' && data.agent_id !== '' && typeof (data.contact_id) !== 'undefined' && data.contact_id !== ''  && typeof (data.description) !== 'undefined' && data.description !== '') {
            let insertSql = "INSERT INTO user_notes SET agent_id=?, contact_id=?, description=?, createdAt=now()";
            appModel.query(insertSql, [data.agent_id, data.contact_id, data.description], (err, rows) => {
                if (err) {
                    res.json({ 'status': 'error', 'message': err });
                }
                else {
                    let sqlQuery = "SELECT t.id, t.agent_id, t.contact_id, t.description, DATE_FORMAT(t.createdAt, '%d/%b %l:%i %p') as createdAt, CONCAT(c.first_name,' ',c.last_name) as contact_name, CONCAT(u.first_name,' ',u.last_name) as agent_name from user_notes  as t INNER JOIN contacts as c ON c.id=t.contact_id INNER JOIN users as u ON u.id=t.agent_id WHERE t.id=?";
                    appModel.query(sqlQuery, [rows.insertId], (err, result) => {
                        if (err) {
                            res.json({ 'status': 'error', 'message': err });
                        }
                        else {
                            if (result && result.length == 0) {
                                res.json({ 'status': 'error', 'message': "Unknown detail" });
                            } else {
                                res.status(200).json({ 'status': 'success', 'data': result[0] });
                            }
                        }
                    });
                }
            });
        }
        else {
            res.json({ 'status': 'error', 'message': "invalid request" });
        }
    },

    create_new_task: async (req, res, next) => {
        let data = req.body;
        if (typeof (data) !== 'undefined' && typeof (data.agent_id) !== 'undefined' && data.agent_id !== '' && typeof (data.contact_id) !== 'undefined' && data.contact_id !== ''  && typeof (data.description) !== 'undefined' && data.description !== '' && typeof (data.task_date) !== 'undefined' && data.task_date !== '') {
            let insertSql = "INSERT INTO user_tasks SET agent_id=?, contact_id=?, description=?, task_date=?, task_type=?, task_status=?, createdAt=now()";
            appModel.query(insertSql, [data.agent_id, data.contact_id, data.description, data.task_date, data.task_type, 1], (err, rows) => {
                if (err) {
                    res.json({ 'status': 'error', 'message': err });
                }
                else {
                    let sqlQuery = "SELECT t.id, t.agent_id, t.contact_id, t.task_status, t.task_type, t.description, t.createdAt, DATE_FORMAT(t.task_date, '%d %b, %Y') as task_date, CONCAT(c.first_name,' ',c.last_name) as contact_name from user_tasks  as t LEFT JOIN contacts as c ON c.id=t.contact_id WHERE t.id=?";
                    appModel.query(sqlQuery, [rows.insertId], (err, result) => {
                        if (err) {
                            res.json({ 'status': 'error', 'message': err });
                        }
                        else {
                            if (result && result.length == 0) {
                                res.json({ 'status': 'error', 'message': "Unknown detail" });
                            } else {
                                res.status(200).json({ 'status': 'success', 'data': result[0] });
                            }
                        }
                    });
                }
            });
        }
        else {
            res.json({ 'status': 'error', 'message': "invalid request" });
        }
    },

    list_all_task: async (req, res, next) => {
        let data = req.body;
        if (typeof (data) !== 'undefined' && typeof (data.agent_id) !== 'undefined' && data.agent_id !== '') {
            let sqlQuery = "SELECT t.id, t.agent_id, t.contact_id, t.task_status, t.description, t.task_type, DATE_FORMAT(t.task_date, '%d %b, %Y') as task_date, CONCAT(c.first_name,' ',c.last_name) as contact_name from user_tasks  as t INNER JOIN contacts as c ON c.id=t.contact_id WHERE t.agent_id=? AND t.task_status=1 ORDER BY t.id DESC";
            appModel.query(sqlQuery, [data.agent_id], (err, result) => {
                if (err) {
                    res.json({ 'status': 'error', 'message': err });
                }
                else {
                    if (result && result.length == 0) {
                        res.json({ 'status': 'error', 'message': "Unknown detail" });
                    } else {
                        res.status(200).json({ 'status': 'success', 'data': result });
                    }
                }
            });
        }
        else {
            res.json({ 'status': 'error', 'message': "invalid request" });
        }
    },

    delete_task: async (req, res, next) => {
        let data = req.body;
        if (typeof (data) !== 'undefined' && typeof (data.task_id) !== 'undefined' && data.task_id !== ''   && typeof (data.action) !== 'undefined' && data.action == 'delete_task') {
            let sqlQuery = "DELETE FROM user_tasks WHERE id=?";
            appModel.query(sqlQuery, [data.task_id], (err, result) => {
                if (err) {
                    res.json({ 'status': 'error', 'message': err });
                }
                else {
                    if (result && result.length == 0) {
                        res.json({ 'status': 'error', 'message': "Unknown detail" });
                    } else {
                        res.status(200).json({ 'status': 'success'});
                    }
                }
            });
        }
        else {
            res.json({ 'status': 'error', 'message': "invalid request" });
        }
    },

    close_task: async (req, res, next) => {
        let data = req.body;
        if (typeof (data) !== 'undefined' && typeof (data.task_id) !== 'undefined' && data.task_id !== ''  && typeof (data.action) !== 'undefined' && data.action == 'close_task') {
            let sqlQuery = "UPDATE user_tasks SET task_status=0 WHERE id=?";
            appModel.query(sqlQuery, [data.task_id], (err, result) => {
                if (err) {
                    res.json({ 'status': 'error', 'message': err });
                }
                else {
                    if (result && result.length == 0) {
                        res.json({ 'status': 'error', 'message': "Unknown detail" });
                    } else {
                        res.status(200).json({ 'status': 'success'});
                    }
                }
            });
        }
        else {
            res.json({ 'status': 'error', 'message': "invalid request" });
        }
    },

    list_all_notes_for_contact: async (req, res, next) => {
        let data = req.body;
        if (typeof (data) !== 'undefined' && typeof (data.contact_id) !== 'undefined' && data.contact_id !== '' && typeof (data.agent_id) !== 'undefined' && data.agent_id !== '') {
            let sqlQuery = "SELECT t.id, t.agent_id, t.contact_id, t.description, DATE_FORMAT(t.createdAt, '%d/%b %l:%i %p') as createdAt, CONCAT(c.first_name,' ',c.last_name) as contact_name, CONCAT(u.first_name,' ',u.last_name) as agent_name FROM user_notes as t INNER JOIN contacts as c ON c.id=t.contact_id INNER JOIN users as u ON u.id=t.agent_id WHERE t.contact_id=? AND t.agent_id=? ORDER BY t.id ASC";
            appModel.query(sqlQuery, [data.contact_id, data.agent_id], (err, result) => {
                if (err) {
                    res.json({ 'status': 'error', 'message': err });
                }
                else {
                    if (result && result.length == 0) {
                        res.json({ 'status': 'error', 'message': "Unknown detail" });
                    } else {
                        res.status(200).json({ 'status': 'success', 'data': result });
                    }
                }
            });
        }
        else {
            res.json({ 'status': 'error', 'message': "invalid request" });
        }
    },

    list_task_by_contact_id: async (req, res, next) => {
        let data = req.body;
        if (typeof (data) !== 'undefined' && typeof (data.contact_id) !== 'undefined' && data.contact_id !== '' && typeof (data.agent_id) !== 'undefined' && data.agent_id !== '') {
            let sqlQuery = "SELECT t.id, t.agent_id, t.contact_id, t.description, DATE_FORMAT(t.task_date, '%d %b, %Y') as task_date, CONCAT(c.first_name,' ',c.last_name) as contact_name FROM user_tasks as t INNER JOIN contacts as c ON c.id=t.contact_id WHERE t.contact_id=? AND t.agent_id=? AND t.task_status=1 ORDER BY t.id DESC";
            appModel.query(sqlQuery, [data.contact_id, data.agent_id], (err, result) => {
                if (err) {
                    res.json({ 'status': 'error', 'message': err });
                }
                else {
                    if (result && result.length == 0) {
                        res.json({ 'status': 'error', 'message': "Unknown detail" });
                    } else {
                        res.status(200).json({ 'status': 'success', 'data': result });
                    }
                }
            });
        }
        else {
            res.json({ 'status': 'error', 'message': "invalid request" });
        }
    },

    update_follow_up_date: async (req, res, next) => {
        let data = req.body;
        if (typeof (data) !== 'undefined' && typeof (data.contact_id) !== 'undefined' && data.contact_id !== '' && typeof (data.follow_up_date) !== 'undefined' && data.follow_up_date !== '') {
            let sqlQuery = "UPDATE contacts set follow_up_date=? WHERE id=?";
            appModel.query(sqlQuery, [data.follow_up_date, data.contact_id], (err, result) => {
                if (err) {
                    res.json({ 'status': 'error', 'message': err });
                }
                else {
                    res.status(200).json({ 'status': 'success' });
                }
            });
        }
        else {
            res.json({ 'status': 'error', 'message': "invalid request" });
        }
    },
};