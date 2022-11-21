const bcrypt = require('bcrypt-nodejs');
const appModel = require('../../models/dbconnection');
const fs = require("fs");
const csv = require("fast-csv");
const csvjs = require("csvtojson");
const { check, validationResult } = require('express-validator');
const { contacts_ajax } = require('./datatable');
var Q = require('q');

function chunk(arr, chunkSize) {
    if (chunkSize <= 0) throw "Invalid chunk size";
    var R = [];
    for (var i = 0, len = arr.length; i < len; i += chunkSize)
        R.push(arr.slice(i, i + chunkSize));
    return R;
}


module.exports = {

    index: function (req, res, next) {
        let message = '';
        if (req.session.success) {
            message = req.session.success;
            delete req.session.success;
        }
        let error = '';
        if (req.session.error) {
            error = req.session.error;
            delete req.session.error;
        }

        let camp = 'select * from campaign';
        let users = 'select * from users';
        appModel.query(camp, function (err, camp) {
            if (err) {
                res.render('admin/csv_upload.ejs', { message: "Error Occur", success: false, result: camp, resultUser: '', resultPost: '', duplicateData: 0 });
            } else {
                appModel.query(users, function (err, users) {
                    res.render('admin/csv_upload.ejs', { message: "", success: true, result: camp, resultUser: users, resultPost: '', duplicateData: 0 });
                })
            }
        })

    },

    edit: function (req, res, next) {
        // change are done
        let getId = req.params.id;
        let states = 'select * from states';
        let camp = 'select * from campaign';
        let tags = 'select * from tags';
        appModel.query(tags, function (err, tags) {
            if (err) {
                res.render('admin/csv_upload.ejs', { message: "Error Occur", success: false, result: states, contactData: '', camp: camp, tags });
            } else {
                appModel.query(camp, function (err, camp) {
                    if (err) {
                        res.render('admin/csv_upload.ejs', { message: "Error Occur", success: false, result: states, contactData: '', camp: camp, tags });
                    } else {
                        appModel.query(states, function (err, states) {
                            if (err) {
                                res.render('admin/edit-contactcsv.ejs', { message: "Unable to Fetch State", success: false, result: states, contactData: '', camp: camp, tags });
                            } else {
                                if (getId) {
                                    let qd = "SELECT * FROM contacts WHERE id=?";
                                    let placeholder = [getId];
                                    appModel.query(qd, placeholder, function (err, rows) {
                                        if (rows) {
                                            res.render('admin/edit-contactcsv.ejs', { user_id: getId, message: '', errors: {}, result: states, contactData: rows[0], camp: camp, tags });
                                        } else {
                                            res.render('admin/edit-contactcsv.ejs', { user_id: '', message: 'Unable to Fetch Contacts', errors: {}, result: states, contactData: '', camp: camp, tags });
                                        }
                                    })
                                } else {
                                    res.render('admin/edit-contactcsv.ejs', { user_id: '', message: '', errors: {}, result: states, contactData: '', camp: camp, tags });
                                }
                            }
                        })
                    }
                })
            }
        })
    },

    update: async function (req, res, next) {
        let getId = req.params.id;
        let post = req.body;
        if (post && post.submitform == 'submitformfile') {
            if (!getId) {
                //VALIDATE FORM
                await check("first_name").isLength({ min: 2 }).withMessage("First name is required and must be at least 2 chars long.").run(req);
                await check("last_name").isLength({ min: 2 }).withMessage("Last name is required and must be at least 2 chars long.").run(req);
                await check("email").isEmail().withMessage("Email is required.").run(req);
                await check("phone_number").isLength({ min: 4, max: 20 }).withMessage("phone_number is required.").run(req);
                await check("stage").isLength({ min: 1 }).withMessage("Stage is required.").run(req);
                await check("is_contacted").isLength({ min: 1 }).withMessage("Is Contacted is required.").run(req);
                await check("listing_price").isLength({ min: 1 }).withMessage("Listing Price is required.").run(req);
                // await check("mutitags").isLength({ min: 1 }).withMessage("Tags is required.").run(req);
                await check("campaing").isLength({ min: 2 }).withMessage("Campaing is required.").run(req);
                await check("state").isLength({ min: 2 }).withMessage("State is required.").run(req);
                await check("city").isLength({ min: 1 }).withMessage("City is required.").run(req);
                await check("post_code").isLength({ min: 1 }).withMessage("Post Code is required.").run(req);
                await check("address").isLength({ min: 2 }).withMessage("Address is required.").run(req);
                // await check("message").isLength({ min: 1 }).withMessage("Message is required.").run(req);

                let errors = validationResult(req);
                if (errors.isEmpty()) {

                    let camp = 'select * from campaign';
                    let tags = 'select * from tags';
                    appModel.query(tags, function (err, tags) {
                        if (err) {
                            res.render('admin/edit-contactcsv.ejs', { message: "Error Occur", success: false, result: states, contactData: post, camp: camp, tags });
                        } else {
                            appModel.query(camp, function (err, camp) {
                                if (err) {
                                    throw err;
                                } else {
                                    let states = 'select * from states';
                                    appModel.query(states, function (err, states) {
                                        if (err) {
                                            res.render('admin/edit-contactcsv.ejs', { message: "Unable to Fetch State", success: false, result: states, contactData: post, camp: camp, tags });
                                        } else {
                                            let qd = "SELECT * FROM contacts WHERE email=?";
                                            let placeholder = [post.email];
                                            appModel.query(qd, placeholder, function (err, rows) {
                                                if (rows.length > 0) {
                                                    res.render('admin/edit-contactcsv.ejs', { user_id: '', message: 'Sorry! Email Address already exists in our database. Please enter another Email Address.', errors: {}, result: states, contactData: post, camp: camp, tags });
                                                } else {
                                                    let q = "INSERT INTO contacts SET email=?, first_name=?, last_name=?, phone_number=?, state=?, address=?,campaign=?, stage=?, is_contacted=?, listing_price=?,tags=?,city=?,post_code=?,message=?,status=?,contact_type=?";
                                                    let insertPlaceholder = [post.email, post.first_name, post.last_name, post.countryCode, post.mutiState, post.address, post.campaing, post.stage, post.is_contacted, post.listing_price, post.mutitags, post.city, post.post_code, post.message, '1', '0'];
                                                    appModel.query(q, insertPlaceholder, function (err, rows) {
                                                        if (err) {
                                                            res.render('admin/edit-contactcsv.ejs', { user_id: '', message: 'Sorry! record not added. Please try again.', errors: {}, result: states, contactData: post, camp: camp, tags });
                                                        } else {
                                                            req.session.success = "New Contact Created successfully.";
                                                            res.redirect("/admin/contacts");
                                                        }
                                                    })
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        }
                    })
                } else {
                    let camp = 'select * from campaign';
                    let tags = 'select * from tags';
                    appModel.query(tags, function (err, tags) {
                        if (err) {
                            res.render('admin/edit-contactcsv.ejs', { message: "Error Occur", success: false, result: states, contactData: post, camp: camp, tags });
                        } else {
                            appModel.query(camp, function (err, camp) {
                                if (err) {
                                    throw err;
                                } else {
                                    let states = 'select * from states';
                                    appModel.query(states, function (err, states) {

                                        if (err) {
                                            res.render('admin/edit-contactcsv.ejs', { message: "Unable to Fetch State", success: false, result: states, contactData: post, camp: camp, tags });
                                        } else {
                                            res.render('admin/edit-contactcsv.ejs', { user_id: '', message: 'Please Fill All Field', success: false, errors: {}, result: states, contactData: post, camp: camp, tags });
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            } else {
                //VALIDATE FORM
                await check("first_name").isLength({ min: 2 }).withMessage("First name is required and must be at least 2 chars long.").run(req);
                await check("last_name").isLength({ min: 2 }).withMessage("Last name is required and must be at least 2 chars long.").run(req);
                await check("email").isEmail().withMessage("Email is required.").run(req);
                await check("phone_number").isLength({ min: 4, max: 20 }).withMessage("phone_number is required.").run(req);
                await check("stage").isLength({ min: 1 }).withMessage("Stage is required.").run(req);
                await check("is_contacted").isLength({ min: 1 }).withMessage("Is Contacted is required.").run(req);
                await check("listing_price").isLength({ min: 1 }).withMessage("Listing Price is required.").run(req);
                // await check("mutitags").isLength({ min: 1 }).withMessage("Tags is required.").run(req);
                await check("campaing").isLength({ min: 2 }).withMessage("Campaing is required.").run(req);
                await check("state").isLength({ min: 2 }).withMessage("State is required.").run(req);
                await check("city").isLength({ min: 1 }).withMessage("City is required.").run(req);
                await check("post_code").isLength({ min: 1 }).withMessage("Post Code is required.").run(req);
                await check("address").isLength({ min: 2 }).withMessage("Address is required.").run(req);
                // await check("message").isLength({ min: 1 }).withMessage("Message is required.").run(req);

                let errors = validationResult(req);
                if (errors.isEmpty()) {
                    var states;
                    let camp = 'select * from campaign';
                    let tags = 'select * from tags';
                    appModel.query(tags, function (err, tags) {
                        if (err) {
                            res.render('admin/edit-contactcsv.ejs', { message: "Error Occur", success: false, result: states, contactData: post, camp: camp, tags });
                        } else {
                            appModel.query(camp, function (err, camp) {
                                if (err) {
                                    throw err;
                                } else {
                                    let states = 'select * from states';
                                    appModel.query(states, function (err, states) {
                                        if (err) {
                                            res.render('admin/edit-contactcsv.ejs', { user_id: getId, message: "Unable to Fetch State", success: false, result: states, contactData: post, camp: camp, tags });
                                        } else {
                                            let qd = "SELECT * FROM contacts WHERE email=? AND id!=?";
                                            let placeholder = [post.email, getId];
                                            appModel.query(qd, placeholder, function (err, rows) {
                                                if (rows.length > 0) {
                                                    res.render('admin/edit-contactcsv.ejs', { user_id: getId, message: 'Sorry! Email Address already exists in our database. Please enter another Email Address.', errors: {}, result: states, contactData: post, camp: camp, tags });
                                                } else {
                                                    let q = "UPDATE contacts SET first_name='" + post.first_name + "', last_name='" + post.last_name + "', email='" + post.email + "', phone_number='" + post.countryCode + "', state='" + post.state + "', address='" + post.address + "', campaign = '" + post.campaing + "', stage='" + post.stage + "', is_contacted='" + post.is_contacted + "', listing_price='" + post.listing_price + "',tags='" + post.mutitags + "',city='" + post.city + "',post_code='" + post.post_code + "',message='" + post.message + "' WHERE id='" + getId + "' ";
                                                    appModel.query(q, function (err, rows) {
                                                        if (err) {
                                                            console.log(err);
                                                            res.render('admin/edit-contactcsv.ejs', { user_id: getId, message: 'Sorry! record not added. Please try again.', errors: {}, result: states, contactData: post, camp: camp, tags });
                                                        } else {
                                                            req.session.success = "Contact Updated Successfully.";
                                                            res.redirect("/admin/contacts");
                                                        }
                                                    })
                                                }
                                            })
                                        }
                                    })
                                }
                            });
                        }
                    })
                } else {
                    let camp = 'select * from campaign';
                    let tags = 'select * from tags';
                    appModel.query(tags, function (err, tags) {
                        if (err) {
                            res.render('admin/edit-contactcsv.ejs', { message: "Error Occur", success: false, result: states, contactData: post, camp: camp, tags });
                        } else {
                            appModel.query(camp, function (err, camp) {
                                if (err) {
                                    throw err;
                                } else {
                                    let states = 'select * from states';
                                    appModel.query(states, function (err, states) {
                                        if (err) {
                                            res.render('admin/edit-contactcsv.ejs', { user_id: getId, message: "Unable to Fetch State", success: false, result: states, contactData: post, camp: camp, tags });
                                        } else {
                                            res.render('admin/edit-contactcsv.ejs', { user_id: getId, message: 'Please Fill All Field', success: false, errors: {}, result: states, contactData: post, camp: camp, tags });
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            }
        } else {
            let camp = 'select * from campaign';
            let tags = 'select * from tags';
            appModel.query(tags, function (err, tags) {
                if (err) {
                    res.render('admin/edit-contactcsv.ejs', { message: "Error Occur", success: false, result: states, contactData: post, camp: camp, tags });
                } else {
                    appModel.query(camp, function (err, camp) {
                        if (err) {
                            throw err;
                        } else {
                            res.render('admin/edit-contactcsv.ejs', { user_id: getId, message: "", success: false, result: states, contactData: post, camp: camp, tags });
                        }
                    })
                }
            })
        }
    },
    checkapp: async function (req, res, next) {
        var post = req.body;
        var campaignName = req.body.campaing;
        if (req.body.csvoption == undefined) {
            let camp = 'select * from campaign';
            let users = 'select * from users';
            appModel.query(camp, function (err, camp) {
                if (err) {
                    return res.render('admin/csv_upload.ejs', { message: "Please select CRM or Zillow csv option.", success: false, result: camp, resultUser: users, resultPost: post, duplicateData: 0 });
                } else {
                    appModel.query(users, function (err, users) {
                        return res.render('admin/csv_upload.ejs', { message: "Please select CRM or Zillow csv option.", success: false, result: camp, resultUser: users, resultPost: post, duplicateData: 0 });
                    })
                }
            })
        }

        if (req.file && req.file.filename !== "") {

            let split = req.file.originalname;
            let fileExt = split.split(".");
            let ExtName = fileExt[fileExt.length - 1];
            let extLower = ExtName.toLowerCase();
            let xRandom = "Batch-" + Math.floor((Math.random() * 1000) * 8 + 3 * 2 + Math.random() * 1000);
            if (extLower == "csv" || extLower == "xlv") {

                var contactArray = await csvjs().fromFile(req.file.path);
                var counter = 0;
                var logicalArray = {};
                var stateArray = [];
                var finalArray = [];

                return Q.Promise(function (resolve, reject, notify) {
                    let listLength = contactArray.length;
                    if (listLength && listLength > 0) {
                        if (req.body.csvoption == "crmcsv") {
                            for (let i = 0; i < listLength; i++) {
                                if (typeof (contactArray[i]['State']) !== 'undefined' && contactArray[i]['State'] !== '') {
                                    if (typeof (logicalArray[contactArray[i]['State']]) !== 'undefined') {
                                        contactArray[i]['agant_id'] = 0;
                                        contactArray[i]['contact_type'] = 0;
                                        logicalArray[contactArray[i]['State']].push(contactArray[i]);
                                    } else {
                                        logicalArray[contactArray[i]['State']] = [];
                                        contactArray[i]['agant_id'] = 0;
                                        contactArray[i]['contact_type'] = 0;
                                        logicalArray[contactArray[i]['State']].push(contactArray[i]);
                                        stateArray.push(contactArray[i]['State']);
                                    }
                                }
                            }
                        } else {
                            for (let i = 0; i < listLength; i++) {
                                if (typeof (contactArray[i]['Property State']) !== 'undefined' && contactArray[i]['Property State'] !== '') {
                                    if (typeof (logicalArray[contactArray[i]['Property State']]) !== 'undefined') {
                                        contactArray[i]['agant_id'] = 0;
                                        contactArray[i]['contact_type'] = 0;
                                        logicalArray[contactArray[i]['Property State']].push(contactArray[i]);
                                    } else {
                                        logicalArray[contactArray[i]['Property State']] = [];
                                        contactArray[i]['agant_id'] = 0;
                                        contactArray[i]['contact_type'] = 0;
                                        logicalArray[contactArray[i]['Property State']].push(contactArray[i]);
                                        stateArray.push(contactArray[i]['Property State']);
                                    }
                                }
                            }
                        }

                        resolve(logicalArray);
                    } else {
                        reject(new Error('Please upload Contacts'));
                    }
                })
                    .then(function (obj) {
                        return Q.Promise(function (resolve, reject, notify) {
                            let scounter = 0
                            let stateLength = stateArray.length;
                            if (stateArray && stateLength > 0) {
                                for (let i = 0; i < stateLength; i++) {
                                    //let q = "select u.id from users as u INNER JOIN user_selected_states as us ON u.id=us.user_id WHERE us.state_abbrev=? AND status=?";
                                    let q = "select u.id from users as u INNER JOIN user_selected_states as us ON u.id=us.user_id WHERE us.state_abbrev=? LIMIT 0, " + logicalArray[stateArray[i]].length;
                                    appModel.query(q, [stateArray[i]], function (err, row) {
                                        if (row && row.length > 0) {
                                            let getChunks = Math.ceil(parseFloat(logicalArray[stateArray[i]].length) / parseFloat(row.length));
                                            let chunkArray = chunk(logicalArray[stateArray[i]], getChunks);
                                            if (chunkArray && chunkArray.length > 0) {
                                                for (let c = 0; c < chunkArray.length; c++) {
                                                    for (let k = 0; k < chunkArray[c].length; k++) {
                                                        if (typeof (row[c]['id']) !== 'undefined' && row[c]['id'] !== '') {
                                                            chunkArray[c][k]['agant_id'] = row[c]['id'];
                                                            chunkArray[c][k]['contact_type'] = 1;
                                                            finalArray.push(chunkArray[c][k]);
                                                        } else {
                                                            chunkArray[c][k]['agant_id'] = row[0]['id'];
                                                            chunkArray[c][k]['contact_type'] = 1;
                                                            finalArray.push(chunkArray[c][k]);

                                                        }
                                                    }

                                                }
                                            }
                                        }
                                        else {
                                            let logicalALength = logicalArray[stateArray[i]].length;
                                            for (let s = 0; s < logicalALength; s++) {
                                                finalArray.push(logicalArray[stateArray[i]][s]);
                                            }
                                        }
                                        scounter++;
                                        if (scounter >= stateLength) {
                                            resolve(finalArray);
                                        }
                                    });
                                }

                            } else {
                                reject(new Error('Please upload Contacts'));
                            }
                        });
                    })
                    .then(function (arr1) {
                        return Q.Promise(function (resolve, reject, notify) {
                            //SPLIT ARRAY TO CHUNK TO SAVE MULTIPLE RECORD

                            let newChunkArray = finalArray;

                            let cheunkCounter = 0;
                            let query = "INSERT INTO`contacts`(`first_name`,`last_name`,`stage`,`is_contacted`,`listing_price`,`tags`,`email`,`phone_number`,`address`,`city`,`state`,`post_code`,`message`,`unique_csv`,`campaign`,`status`,`user_fid`,`contact_type`) VALUES ? ";

                            if (newChunkArray && newChunkArray.length > 0) {
                                let insarray = [];
                                let duplicateFound = [];
                                let check = "";
                                if (req.body.csvoption == "crmcsv") {
                                    for (var i = 0; i < newChunkArray.length; i++) {
                                        if (newChunkArray[i]['Email'].length == 0) {
                                            duplicateFound.push([newChunkArray[i]['First Name'], newChunkArray[i]['Last Name'], newChunkArray[i]['Stage'], newChunkArray[i]['Is Contacted'], newChunkArray[i]['Listing Price'], newChunkArray[i]['Tags'], newChunkArray[i]['Email'], newChunkArray[i]['Phone'], newChunkArray[i]['Address'], newChunkArray[i]['City'], newChunkArray[i]['State'], newChunkArray[i]['Postal Code'], newChunkArray[i]['Message']]);
                                            newChunkArray.splice(i, 1);
                                        }
                                    }

                                    for (var i = 0; i < newChunkArray.length; i++) {
                                        for (var j = 1; j < newChunkArray.length; j++) {
                                            if (i != j) {
                                                if (newChunkArray[i]['Email'] == newChunkArray[j]['Email']) {
                                                    duplicateFound.push([newChunkArray[j]['First Name'], newChunkArray[j]['Last Name'], newChunkArray[j]['Stage'], newChunkArray[j]['Is Contacted'], newChunkArray[j]['Listing Price'], newChunkArray[j]['Tags'], newChunkArray[j]['Email'], newChunkArray[j]['Phone'], newChunkArray[j]['Address'], newChunkArray[j]['City'], newChunkArray[j]['State'], newChunkArray[j]['Postal Code'], newChunkArray[j]['Message']]);
                                                    newChunkArray.splice(j, 1);
                                                };
                                            }
                                        }
                                    }

                                } else {
                                    for (var i = 0; i < newChunkArray.length; i++) {
                                        if (newChunkArray[i]['Email 1'].length == 0) {
                                            duplicateFound.push([newChunkArray[i]['First Name'], newChunkArray[i]['Last Name'], newChunkArray[i]['Stage'], newChunkArray[i]['Is Contacted'], newChunkArray[i]['Listing Price'], newChunkArray[i]['Tags'], newChunkArray[i]['Email 1'], newChunkArray[i]['Phone 1'], newChunkArray[i]['Property Address'], newChunkArray[i]['Property City'], newChunkArray[i]['Property State'], newChunkArray[i]['Property Postal Code'], newChunkArray[i]['Message']])
                                            newChunkArray.splice(i, 1);
                                        }
                                    }

                                    for (var i = 0; i < newChunkArray.length; i++) {
                                        for (var j = 1; j < newChunkArray.length; j++) {
                                            if (i != j) {
                                                if (newChunkArray[i]['Email 1'] == newChunkArray[j]['Email 1']) {
                                                    duplicateFound.push([newChunkArray[j]['First Name'], newChunkArray[j]['Last Name'], newChunkArray[j]['Stage'], newChunkArray[j]['Is Contacted'], newChunkArray[j]['Listing Price'], newChunkArray[j]['Tags'], newChunkArray[j]['Email 1'], newChunkArray[j]['Phone 1'], newChunkArray[j]['Property Address'], newChunkArray[j]['Property City'], newChunkArray[j]['Property State'], newChunkArray[j]['Property Postal Code'], newChunkArray[j]['Message']])
                                                    newChunkArray.splice(j, 1);
                                                };
                                            }
                                        }
                                    }
                                }

                                for (let c = 0; c < newChunkArray.length; c++) {
                                    if (req.body.csvoption == "crmcsv") {
                                        check = "select * from contacts where email = '" + newChunkArray[c]['Email'] + "'";
                                    } else {
                                        check = "select * from contacts where email = '" + newChunkArray[c]['Email 1'] + "'";
                                    }
                                    appModel.query(check, (err, response) => {

                                        if (req.body.csvoption == "crmcsv") {
                                            if (response.length > 0) {
                                                duplicateFound.push([newChunkArray[c]['First Name'], newChunkArray[c]['Last Name'], newChunkArray[c]['Stage'], newChunkArray[c]['Is Contacted'], newChunkArray[c]['Listing Price'], newChunkArray[c]['Tags'], newChunkArray[c]['Email'], newChunkArray[c]['Phone'], newChunkArray[c]['Address'], newChunkArray[c]['City'], newChunkArray[c]['State'], newChunkArray[c]['Postal Code'], newChunkArray[c]['Message']]);
                                            } else {
                                                insarray.push([newChunkArray[c]['First Name'], newChunkArray[c]['Last Name'], newChunkArray[c]['Stage'], newChunkArray[c]['Is Contacted'], newChunkArray[c]['Listing Price'], newChunkArray[c]['Tags'], newChunkArray[c]['Email'], newChunkArray[c]['Phone'], newChunkArray[c]['Address'], newChunkArray[c]['City'], newChunkArray[c]['State'], newChunkArray[c]['Postal Code'], newChunkArray[c]['Message'], xRandom, campaignName, '1', newChunkArray[c]['agant_id'], newChunkArray[c]['contact_type']]);
                                            }
                                        } else {
                                            if (response.length > 0) {
                                                duplicateFound.push([newChunkArray[c]['First Name'], newChunkArray[c]['Last Name'], newChunkArray[c]['Stage'], newChunkArray[c]['Is Contacted'], newChunkArray[c]['Listing Price'], newChunkArray[c]['Tags'], newChunkArray[c]['Email 1'], newChunkArray[c]['Phone 1'], newChunkArray[c]['Property Address'], newChunkArray[c]['Property City'], newChunkArray[c]['Property State'], newChunkArray[c]['Property Postal Code'], newChunkArray[c]['Message']]);
                                            } else {
                                                insarray.push([newChunkArray[c]['First Name'], newChunkArray[c]['Last Name'], newChunkArray[c]['Stage'], newChunkArray[c]['Is Contacted'], newChunkArray[c]['Listing Price'], newChunkArray[c]['Tags'], newChunkArray[c]['Email 1'], newChunkArray[c]['Phone 1'], newChunkArray[c]['Property Address'], newChunkArray[c]['Property City'], newChunkArray[c]['Property State'], newChunkArray[c]['Property Postal Code'], newChunkArray[c]['Message'], xRandom, campaignName, '1', newChunkArray[c]['agant_id'], newChunkArray[c]['contact_type']]);
                                            }
                                        }
                                        cheunkCounter++;

                                        if (cheunkCounter >= newChunkArray.length) {
                                            var data = duplicateFound;
                                            var csv = "First Name, Last Name, Stage, Is Contacted, Listing Pricing, Tags, Email, Phone Number, Address, City,State, Postal Code, Message \n";
                                            for (let i of data) {
                                                var updatedI = [];
                                                updatedI.push(i[0], i[1], i[2], i[3], i[4], '"' + i[5] + '"', i[6], i[7], i[8], i[9], i[10], i[11], '"' + i[12] + '"');
                                                csv += updatedI.join(",") + "\r\n";
                                            }

                                            fs.writeFileSync(process.cwd() + "/public/css/duplicate.csv", csv);
                                            if (insarray.length > 0) {
                                                let insertPlace = [insarray];
                                                appModel.query(query, insertPlace, (error, response) => {
                                                    if (error) {
                                                        console.log("error", error);
                                                        let camp = 'select * from campaign';
                                                        if (error.code == 'ER_DUP_ENTRY') {
                                                            appModel.query(camp, function (err, camp) {
                                                                return res.render('admin/csv_upload.ejs', { message: "Duplicate Entry Please check CSV", success: false, result: camp, resultUser: '', duplicateData: 0 });
                                                            });
                                                        }

                                                        appModel.query(camp, function (err, camp) {
                                                            return res.render('admin/csv_upload.ejs', { message: "Something went wrong! Please try agian later", success: false, result: camp, resultUser: '', duplicateData: 0 });
                                                        });
                                                    } else {

                                                        let camp = 'select * from campaign';
                                                        let users = 'select * from users';
                                                        appModel.query(camp, function (err, camp) {
                                                            if (err) {
                                                                return res.render('admin/csv_upload.ejs', { message: "Error While Uploaded CSV File", success: false, result: camp, resultUser: '', duplicateData: 0 });
                                                            } else {
                                                                appModel.query(users, function (err, users) {
                                                                    return res.render('admin/csv_upload.ejs', { message: `Successfully Uploaded (${insarray.length}) Records, Dulicate Entries Found (${duplicateFound.length}) Records`, success: true, result: camp, resultUser: users, duplicateData: duplicateFound.length });
                                                                })
                                                            }
                                                        })
                                                    }
                                                });
                                            } else {
                                                let camp = 'select * from campaign';
                                                let users = 'select * from users';
                                                appModel.query(camp, function (err, camp) {
                                                    if (err) {
                                                        return res.render('admin/csv_upload.ejs', { message: "Error While Uploaded CSV File", success: false, result: camp, resultUser: '', duplicateData: 0 });
                                                    } else {
                                                        appModel.query(users, function (err, users) {
                                                            return res.render('admin/csv_upload.ejs', { message: `Successfully Uploaded (${insarray.length}) Records, Dulicate Entries Found (${duplicateFound.length}) Records`, success: true, duplicateData: duplicateFound.length, result: camp, resultUser: users });
                                                        })
                                                    }
                                                })
                                            }
                                        }


                                    });
                                }
                            }
                            //resolve(arr1);
                        });
                    })
                    .then(function (arr) {
                        return Q.Promise(function (resolve, reject, notify) {
                            res.status(200);
                            res.send({ "status": "ok", "message": "success", "contacts": arr });
                        });
                    })
                    .catch(function (err) {
                        res.send({ "status": "error", "message": "Unable to get the process data, " + err });
                    });
            } else {

                let camp = 'select * from campaign';
                let users = 'select * from users';
                appModel.query(camp, function (err, camp) {
                    if (err) {
                        res.render('admin/csv_upload.ejs', { message: "Please Upload 'CSV' or 'XLV' File Only.", success: false, result: camp, resultUser: '', duplicateData: 0 });
                    } else {
                        appModel.query(users, function (err, users) {
                            res.render('admin/csv_upload.ejs', { message: "Please Upload 'CSV' or 'XLV' File Only.", success: false, result: camp, resultUser: users, duplicateData: 0 });
                        })
                    }
                })
            }
        } else {
            let camp = 'select * from campaign';
            let users = 'select * from users';
            appModel.query(camp, function (err, camp) {
                if (err) {
                    res.render('admin/csv_upload.ejs', { message: "Please Upload File", success: false, field: '', result: 'camp', resultUser: '', duplicateData: 0 });
                } else {
                    appModel.query(users, function (err, users) {

                        res.render('admin/csv_upload.ejs', { message: "Please Upload File", success: false, field: '', result: camp, resultUser: users, duplicateData: 0 });
                    })
                }
            })
        }
    },

    uploadcsv: async function (req, res, next) {

        try {
            if (req.file && req.file.filename !== "") {
                let split = req.file.originalname;
                let fileExt = split.split(".");
                let ExtName = fileExt[fileExt.length - 1];
                let extLower = ExtName.toLowerCase();
                var post = req.body;

                if (extLower == "csv" || extLower == "xlv") {
                    if (req.body.csvoption == undefined) {

                        let camp = 'select * from campaign';
                        let users = 'select * from users';
                        appModel.query(camp, function (err, camp) {
                            if (err) {
                                res.render('admin/csv_upload.ejs', { message: "Please select CRM or Zillow csv option.", success: false, result: camp, resultUser: users, resultPost: post, duplicateData: 0 });
                            } else {
                                appModel.query(users, function (err, users) {
                                    res.render('admin/csv_upload.ejs', { message: "Please select CRM or Zillow csv option.", success: false, result: camp, resultUser: users, resultPost: post, duplicateData: 0 });
                                })
                            }
                        })
                    } else {
                        UploadCsvDataToMySQL(process.cwd() + "/public/uploads/" + req.file.filename, res, req);
                    }
                } else {

                    let camp = 'select * from campaign';
                    let users = 'select * from users';
                    appModel.query(camp, function (err, camp) {
                        if (err) {
                            res.render('admin/csv_upload.ejs', { message: "Please Upload 'CSV' or 'XLV' File Only.", success: false, result: camp, resultUser: users, resultPost: post, duplicateData: 0 });
                        } else {
                            appModel.query(users, function (err, users) {
                                res.render('admin/csv_upload.ejs', { message: "Please Upload 'CSV' or 'XLV' File Only.", success: false, result: camp, resultUser: users, resultPost: post, duplicateData: 0 });
                            })
                        }
                    })
                };
            } else {
                let camp = 'select * from campaign';
                let users = 'select * from users';
                appModel.query(camp, function (err, camp) {
                    if (err) {
                        res.render('admin/csv_upload.ejs', { message: "Please Upload File", success: false, field: '', result: 'camp', resultUser: users, resultPost: post, duplicateData: 0 });
                    } else {
                        appModel.query(users, function (err, users) {
                            //res.render('admin/csv_upload.ejs', { message: "Please Upload File", success: false, field: req.file.fieldname, result: camp, resultUser: users });
                            res.render('admin/csv_upload.ejs', { message: "Please Upload File", success: false, field: '', result: camp, resultUser: users, resultPost: post, duplicateData: 0 });
                        })
                    }
                })
            }
        } catch (error) {
            let camp = 'select * from campaign';
            let users = 'select * from users';
            appModel.query(camp, function (err, camp) {
                if (err) {
                    res.render('admin/csv_upload.ejs', { message: "Error While Uploading Data Or Please Upload File", success: false, field: '', result: camp, resultUser: users, resultPost: post, duplicateData: 0 });
                } else {
                    appModel.query(users, function (err, users) {
                        res.render('admin/csv_upload.ejs', { message: "Error While Uploading Data Or Please Upload File", success: false, field: '', result: camp, resultUser: users, resultPost: post, duplicateData: 0 });
                    })
                }
            })
        }
    },


};

function valuecount(array, value) {
    var count = 0;
    for (var i = 0; i < array.length; ++i) {
        if (array[i] == value)
            count++;
    }
    return count;
}

//ulpoad csv file
function UploadCsvDataToMySQL(filePath, res, req) {

    try {
        let stream = fs.createReadStream(filePath);
        let csvData = [];
        let tempCsvData = [];
        let arrdata = '';
        let campaignName = '';
        if (req.body.campaing != 'C_NOT_SELECTED') {
            campaignName = req.body.campaing;
            let csvStream = csv
                .parse()
                .on("data", function (data) {
                    tempCsvData.push(data);
                })
                .on("end", function () {
                    // csvData.shift();
                    let query = '';
                    let xRandom = "Batch-" + Math.floor((Math.random() * 1000) * 8 + 3 * 2 + Math.random() * 1000);

                    if (req.body.csvoption == 'crmcsv') {
                        for (var i = 1; i < tempCsvData.length; i++) {
                            var replace1 = tempCsvData[i][7];
                            var replace2 = replace1.replace("(", "+");
                            var setPlus = replace2.replace(")", "");
                            csvData.push([tempCsvData[i][6], tempCsvData[i][0], tempCsvData[i][1], setPlus, tempCsvData[i][10], tempCsvData[i][8], tempCsvData[i][2], tempCsvData[i][3], tempCsvData[i][4], tempCsvData[i][5], tempCsvData[i][9], tempCsvData[i][11], tempCsvData[i][12], xRandom]);
                        };
                    } else if (req.body.csvoption == 'zilocsv') {
                        for (var i = 1; i < tempCsvData.length; i++) {
                            var replace1 = tempCsvData[i][11];
                            var replace2 = replace1.replace("(", "+");
                            var setPlus = replace2.replace(")", "");
                            csvData.push([tempCsvData[i][9], tempCsvData[i][2], tempCsvData[i][3], setPlus, tempCsvData[i][15], tempCsvData[i][13], tempCsvData[i][4], tempCsvData[i][6], tempCsvData[i][7], tempCsvData[i][8], tempCsvData[i][14], tempCsvData[i][16], tempCsvData[i][23], xRandom]);
                        };
                    }

                    // NEw =======================
                    let duplicateFound = [];

                    for (var i = 0; i < csvData.length; i++) {
                        if (csvData[i][0].length == 0) {
                            duplicateFound.push(csvData[i]);
                            csvData.splice(i, 1);
                        }
                    }

                    for (var i = 0; i < csvData.length; i++) {
                        for (var j = 1; j < csvData.length; j++) {
                            if (i != j) {
                                if (csvData[i][0] == csvData[j][0]) {
                                    duplicateFound.push(csvData[j]);
                                    csvData.splice(j, 1);
                                };

                            }
                        }
                    }
                    // New ==========================

                    if (req.body.select_type == 'unassigned') {
                        // For Unassigned || Do Not Assigned
                        csvData.forEach(item => {
                            item.push(campaignName, '1', '0');
                        });

                        query = "INSERT INTO`contacts`(`email`, `first_name`, `last_name`, `phone_number`, `state`, `address`,`stage`,`is_contacted`,`listing_price`,`tags`,`city`,`post_code`,`message`,`unique_csv`, `campaign`, `status`, `contact_type`) VALUES ? ";

                    } else if (req.body.select_type == 'DND') {
                        // For Do Not Disturb
                        csvData.forEach(item => {
                            item.push(campaignName, '1', '2');
                        });

                        query = "INSERT INTO`contacts`(`email`, `first_name`, `last_name`, `phone_number`, `state`, `address`,`stage`,`is_contacted`,`listing_price`,`tags`,`city`,`post_code`,`message`,`unique_csv`, `campaign`, `status`, `contact_type`) VALUES ? ";

                    } else {
                        // For Assigned Manual
                        if (req.body.amdata != 'AM_NOT_SELECTED') {
                            csvData.forEach(item => {
                                item.push(campaignName, '1', req.body.amdata, '1');
                            });

                            query = "INSERT INTO`contacts`(`email`, `first_name`, `last_name`, `phone_number`, `state`, `address`,`stage`,`is_contacted`,`listing_price`,`tags`,`city`,`post_code`,`message`,`unique_csv`, `campaign`, `status`,`user_fid`,`contact_type`) VALUES ? ";
                        }
                    }

                    let check = "select * from contacts";
                    appModel.query(check, (err, response) => {
                        if (err) {
                            throw err;
                        } else {
                            response.forEach((insertitem, index) => {
                                var alreadyAvailable = insertitem.email;
                                csvData.forEach((csvitem, ind) => {
                                    if (csvitem[0] == alreadyAvailable) {
                                        duplicateFound.push(csvitem);
                                        csvData.splice(ind, 1);
                                    }
                                })
                            })

                            var data = duplicateFound;
                            var csv = "First Name, Last Name, Stage, Is Contacted, Listing Pricing, Tags, Email, Phone Number, Address, City,State, Postal Code, Message \n";
                            for (let i of data) {
                                var updatedI = [];
                                updatedI.push(i[1], i[2], i[6], i[7], i[8], '"' + i[9] + '"', i[0], i[3], i[5], i[10], i[4], i[11], '"' + i[12] + '"');
                                csv += updatedI.join(",") + "\r\n";
                            }

                            fs.writeFileSync(process.cwd() + "/public/css/duplicate.csv", csv);

                            let insertPlaceholder = [csvData];
                            appModel.query(query, insertPlaceholder, (error, response) => {
                                if (error) {
                                    if (error.code == 'ER_DUP_ENTRY') {
                                        let camp = 'select * from campaign';
                                        let users = 'select * from users';
                                        appModel.query(camp, function (err, camp) {
                                            if (err) {
                                                return res.render('admin/csv_upload.ejs', { message: error.sqlMessage, success: false, result: camp, resultUser: '', duplicateData: 0 });
                                            } else {
                                                appModel.query(users, function (err, users) {
                                                    return res.render('admin/csv_upload.ejs', { message: error.sqlMessage, success: false, result: camp, resultUser: users, duplicateData: 0 });
                                                })
                                            }
                                        })
                                    }

                                }

                                let camp = 'select * from campaign';
                                let users = 'select * from users';
                                appModel.query(camp, function (err, camp) {
                                    if (err) {
                                        return res.render('admin/csv_upload.ejs', { message: "Error While Uploaded CSV File", success: false, result: camp, resultUser: '', duplicateData: 0 });
                                    } else {
                                        appModel.query(users, function (err, users) {
                                            return res.render('admin/csv_upload.ejs', { message: `Successfully Uploaded (${csvData.length}) Records, Dulicate Entries Found (${duplicateFound.length}) Records`, success: true, result: camp, resultUser: users, duplicateData: duplicateFound.length });
                                        })
                                    }
                                })
                            });
                        }
                    })
                    // delete file after saving to MySQL database
                    fs.unlinkSync(filePath);
                });
            stream.pipe(csvStream);
        } else {

            let camp = 'select * from campaign';
            let users = 'select * from users';
            appModel.query(camp, function (err, camp) {
                if (err) {
                    return res.render('admin/csv_upload.ejs', { message: "Please Select Campaign", success: false, result: camp, resultUser: '', duplicateData: 0 });
                } else {
                    appModel.query(users, function (err, users) {
                        return res.render('admin/csv_upload.ejs', { message: "Please Select Campaign", success: false, result: camp, resultUser: users, duplicateData: 0 });
                    })
                }
            })

        }
    } catch (error) {
        console.log(error);
    }

}

