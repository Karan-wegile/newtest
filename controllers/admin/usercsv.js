const bcrypt = require("bcrypt-nodejs");
const appModel = require("../../models/dbconnection");
const fs = require("fs");
const csv = require("fast-csv");
const { check, validationResult } = require("express-validator");
const { contacts_ajax } = require("./datatable");

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
        res.render("admin/add-bulk.ejs", { success: message, errors: error });
    },
    uploadcsv: async function(req, res, next) {
        try {
            if (req.file && req.file.filename !== "") {
                let split = req.file.originalname;
                let fileExt = split.split(".");
                let ExtName = fileExt[fileExt.length - 1];
                let extLower = ExtName.toLowerCase();
                if (extLower == "csv" || extLower == "xlv") {
                    UploadCsvDataToMySQL(
                        process.cwd() + "/public/user_uploads/" + req.file.filename,
                        res,
                        req
                    );
                } else {
                    res.render("admin/add-bulk.ejs", {
                        success: false,
                        errors: "Please Upload 'CSV' or 'XLV' File Only.",
                        message: "Please Upload 'CSV' or 'XLV' File Only.",
                    });
                }
            } else {

                res.render("admin/add-bulk.ejs", {
                    message: "Please Upload File",
                    success: false,
                    errors: "Please Upload File.",
                    field: req.file.fieldname,
                });
            }
        } catch (error) {
            console.log(error, 'catch err')
            res.render("admin/add-bulk.ejs", {
                message: "Error While Uploading Data Or Please Upload File",
                errors: "Error While Uploading Data Or Please Upload File",
                success: false,
                field: "",
            });
        }
    },

};


function validatePhoneNumber(input_str) {
    var re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;

    return re.test(input_str);
}
//ulpoad csv file

 function UploadCsvDataToMySQL(filePath, res, req) {
    try {
        var stream = fs.createReadStream(filePath);
        var csvData = [];
        var tempCsvData = [];

        var csvStream = csv.parse().on("data", function(data) {
            tempCsvData.push(data);
        }).on("end", function() {
            // csvData.shift();

          fs.unlinkSync(filePath);
            var counter =1;
            var successCounter=0;
            var failCounter=0;
            var getResultLength = tempCsvData.length;
            let q = "INSERT INTO users SET first_name=?, last_name=?, email=?, phone_number=?, state=?, licence_no=?, licence_expire=?, createdAt=now(),updatedAt=now()";
            for (var i = 1; i < getResultLength; i++) {
              let arrayPlaceholder = [tempCsvData[i][0], tempCsvData[i][1], tempCsvData[i][2], tempCsvData[i][3], tempCsvData[i][4], tempCsvData[i][5], tempCsvData[i][6]];
               appModel.query(q, arrayPlaceholder, function(err, rows) {
                  if (err) {
                      counter++;
                      failCounter++;
                      /*if (err.code == "ER_DUP_ENTRY") {
                          
                      }*/
                      console.log("err",err)

                      if(counter>=getResultLength) {
                        let message=`Data imported (Success: ${successCounter}) (Failed ${failCounter})`;
                        let errorMessage='';
                        if(successCounter==0) {
                          message ='';
                          errorMessage=`something went wrong (Success: ${successCounter}) (Failed ${failCounter})`;
                        }
                        
                        return res.render("admin/add-bulk.ejs", {
                            success: message,
                            errors: errorMessage,
                            message: '',
                        });
                      }


                  }
                  else {
                    console.log("rows",rows);
                    console.log(tempCsvData[counter]);
                    let userState = tempCsvData[counter][4];
                    counter++;
                    successCounter++;
                    

                    let userStates = "INSERT INTO user_selected_states SET user_id=?, state_abbrev=?,createdAt=now()";
                    let placeholderArray = [rows.insertId, userState];
                    appModel.query(userStates, placeholderArray, function(err1, rows1) {
                       
                    });


                    if(counter>=getResultLength) {
                      let message=`Data imported (Success: ${successCounter}) (Failed ${failCounter})`;
                      let errorMessage='';
                      if(successCounter==0) {
                        message ='';
                        errorMessage=`something went wrong (Success: ${successCounter}) (Failed ${failCounter})`;
                      }
                      
                      return res.render("admin/add-bulk.ejs", {
                          success: message,
                          errors: errorMessage,
                          message: '',
                      });
                    }
                  }
              });
            }


            /*for (var i = 1; i < tempCsvData.length; i++) {
                var checkphonevalid = validatePhoneNumber(tempCsvData[i][3]);
                csvData.push([tempCsvData[i][0], tempCsvData[i][1], tempCsvData[i][2], tempCsvData[i][3], tempCsvData[i][4], tempCsvData[i][5], tempCsvData[i][6]]);
            };
            if (checkphonevalid == false) {
                return res.render("admin/add-bulk.ejs", {
                    success: false,
                    errors: "phone_number not valid",
                    message: '',
                });
            }
            let query = "INSERT INTO`users`(`first_name`,`last_name`,`email`,`phone_number`,`state`,`licence_no`,`licence_expire`) VALUES ? ";
            let insertPlaceholder = [csvData];
            appModel.query(query, insertPlaceholder, (error, response) => {


                if (error) {
                    console.log(error, 'eror')
                    console.log(checkphonevalid, 'checkphonevalid')

                    if (error.code == "ER_DUP_ENTRY") {
                        return res.render("admin/add-bulk.ejs", {
                            success: false,
                            errors: "duplicate data",
                            message: error.sqlMessage,
                        });
                    }

                    return res.render("admin/add-bulk.ejs", {
                        success: false,
                        errors: "something went wrong",
                        message: error.sqlMessage,
                    });
                }

                return res.render("admin/add-bulk.ejs", {
                    success: "Successfully Uploaded CSV File",
                    errors: "",
                    message: "",
                });
            });*/

            // // delete file after saving to MySQL database
            
        });
        stream.pipe(csvStream);
    } catch (error) {
        console.log(error);
    }
}