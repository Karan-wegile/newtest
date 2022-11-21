const bcrypt = require('bcrypt-nodejs');
const appModel = require('../../models/dbconnection');
const { check, validationResult } = require('express-validator');

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

        let qd = "select * FROM users";
        appModel.query(qd, function (err, rows) {
            if (err) {
                res.render('admin/contact.ejs', { success: message, errors: error, result: rows });
            }
            else {
                res.render('admin/contact.ejs', { success: message, errors: error, result: rows });
            }
        });
        // res.render('admin/contact.ejs', { success: message, errors: error });
    },

    contactAction: async function (req, res, next) {
        const { type, data } = req.body;
        if (type == 'assigned') {
            data.idArr.forEach(item => {
                let q = `UPDATE contacts SET assign_date=now(), contact_type = '1', user_fid=${data.agentArr[0]} WHERE id = ${item}`;
                appModel.query(q, function (err, rows) {
                    return next();
                });
            })

        } else if (type == 'DND') {
            data.forEach(item => {
                let q = `UPDATE contacts SET  dnd_date=now(), contact_type = '2', user_fid= ${null} WHERE id = ${item}`;
                appModel.query(q, function (err, rows) {
                    return next();
                });
            })
        } else if (type == "delete") {
            data.forEach(item => {
                let q = `DELETE FROM contacts WHERE id= ${item}`;
                appModel.query(q, function (err, rows) {
                    return next();
                });
            })
        }
    }
}; 
