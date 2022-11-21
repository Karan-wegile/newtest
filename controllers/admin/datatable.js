const appModel = require("../../models/dbconnection");
var dateFormat = require("dateformat");

var isset = function (str) {
  if (typeof str != "undefined") {
    return true;
  }
  return false;
};

var trim = function (str) {
  return str.trim();
};

var substr_replace = function (str, replace, start, length) {
  if (start < 0) {
    // start position in str
    start = start + str.length;
  }
  length = length !== undefined ? length : str.length;
  if (length < 0) {
    length = length + str.length - start;
  }
  return (
    str.slice(0, start) +
    replace.substr(0, length) +
    replace.slice(length) +
    str.slice(start + length)
  );
};

var addslashes = function (str) {
  return (str + "").replace(/[\\"']/g, "\\$&").replace(/\u0000/g, "\\0");
};

module.exports = {
  
  admin_users: function (req, res, next) {
    request = req.query;
    var aColumns = [
      "email",
      "first_name",
      "last_name",
      "createdAt",
      "status",
      "id",
    ];
    var sIndexColumn = "id";
    var sTable = "admin";

    var sLimit = "";
    if (request["start"] && request["length"] != -1) {
      sLimit = "LIMIT " + request["start"] + ", " + request["length"];
    }

    //Ordering
    var sOrder = "ORDER BY id DESC";
    if (
      isset(request["order"]) &&
      isset(request["order"][0]["dir"]) &&
      trim(request["order"][0]["dir"]) !== ""
    ) {
      sOrder =
        "ORDER BY " +
        aColumns[request["order"][0]["column"]] +
        " " +
        request["order"][0]["dir"];
    }

    /*
     * Filtering
     * NOTE this does not match the built-in DataTables filtering which does it
     * word by word on any field. It's possible to do here, but concerned about efficiency
     * on very large tables, and MySQL's regex functionality is very limited
     */

    var sWhere = "";
    if (isset(request["search"]["value"]) && request["search"]["value"] != "") {
      flArray = aColumns;
      sWhere = "WHERE (";
      for (var i = 0; i < flArray.length; i++) {
        sWhere +=
          flArray[i] +
          " LIKE '%" +
          addslashes(request["search"]["value"]) +
          "%' OR ";
      }
      sWhere = substr_replace(sWhere, "", -3);
      sWhere += ")";
    }

    /* Individual column filtering */
    for (i = 0; i < aColumns.length; i++) {
      if (
        isset(request["columns"]) &&
        isset(request["columns"][i]) &&
        request["columns"][i]["searchable"] == "true" &&
        request["columns"][i]["search"]["value"] != ""
      ) {
        if (sWhere == "") {
          sWhere = "WHERE ";
        } else {
          sWhere += " AND ";
        }
        sWhere +=
          aColumns[i] +
          " LIKE '%" +
          addslashes(request["columns"][i]["search"]["value"]) +
          "%' ";
      }
    }

    /*
     * SQL queries
     * Get data to display
     */
    var sQuery =
      "SELECT " +
      aColumns.join(",") +
      " FROM " +
      sTable +
      " " +
      sWhere +
      " " +
      sOrder +
      " " +
      sLimit +
      "";
    var rResult = {};
    var rResultFilterTotal = {};
    var aResultFilterTotal = {};
    var iFilteredTotal = {};
    var iTotal = {};
    var rResultTotal = {};
    var aResultTotal = {};

    appModel.query(sQuery, function (err, rows) {
      if (err) {
        res.send(err);
      } else {
        rResult = rows;
        sQuery =
          "SELECT " +
          aColumns.join(",") +
          " FROM " +
          sTable +
          " " +
          sWhere +
          " " +
          sOrder +
          "";
        appModel.query(sQuery, function (err, rows) {
          if (err) {
            res.send(err);
          } else {
            iFilteredTotal = rows.length;

            sQuery =
              "SELECT COUNT(" +
              sIndexColumn +
              ") as total  FROM " +
              sTable +
              "";
            appModel.query(sQuery, function (err, rows) {
              if (err) {
                res.send(err);
              } else {
                iTotal = rows[0]["total"];
                //Output
                var output = {};
                var temp = [];
                output.draw = parseInt(request["draw"]);
                output.recordsTotal = iTotal;
                output.recordsFiltered = iFilteredTotal;
                output.data = [];

                var aRow = rResult;
                var row = [];
                var editUrl = "";
                for (var i in aRow) {
                  for (Field in aRow[i]) {
                    if (Field == "id") {
                      continue;
                    } else if (Field == "createdAt") {
                      var created = dateFormat(
                        aRow[i]["createdAt"],
                        "mmmm dS, yyyy"
                      );
                      temp.push(created);
                    } else {
                      if (!aRow[i].hasOwnProperty(Field)) continue;
                      temp.push(aRow[i][Field]);
                    }
                  }
                  editUrl =
                    '<a role="button" class="btn btn-primary btn-sm" href="edit-admin/' +
                    aRow[i]["id"] +
                    '" title="Update"><i class="fa fa-pencil"></i></a>&nbsp;';
                  editUrl +=
                    '<a role="button" class="btn btn-danger btn-sm" href="admin-users/delete/' +
                    aRow[i]["id"] +
                    '" title="Delete"  onclick="javascript: return confirmDelete();"><i class="fa fa-trash btn-sm"></i></a>';
                  temp.push(editUrl);
                  output.data.push(temp);
                  temp = [];
                }
                res.send(output);
              }
            });
          }
        });
      }
    });
  },

  agents_ajax: function (req, res, next) {
    request = req.query;
    var aColumns = [
      "id",
      "first_name",
      "phone_number",
      "email",
      "last_name",
      "state",
      "licence_no",
      "licence_expire",
      "status",
    ];
    // "(SELECT GROUP_CONCAT(abbrev SEPARATOR ', ') from states WHERE FIND_IN_SET(abbrev,u.state)) as state",

    var sIndexColumn = "id";
    var sTable = "users as u";

    var sLimit = "";
    if (request["start"] && request["length"] != -1) {
      sLimit = "LIMIT " + request["start"] + ", " + request["length"];
    }

    //Ordering
    var sOrder = "ORDER BY id DESC";
    if (
      isset(request["order"]) &&
      isset(request["order"][0]["dir"]) &&
      trim(request["order"][0]["dir"]) !== ""
    ) {
      sOrder =
        "ORDER BY " +
        aColumns[request["order"][0]["column"]] +
        " " +
        request["order"][0]["dir"];
    }

    /*
     * Filtering
     * NOTE this does not match the built-in DataTables filtering which does it
     * word by word on any field. It's possible to do here, but concerned about efficiency
     * on very large tables, and MySQL's regex functionality is very limited
     */

    var sWhere = " WHERE status =0 ";
    if (req.query.type == "Active") {
      sWhere = " WHERE status=1  ";
    }
    else if (req.query.type == "Archived") {
      sWhere = " WHERE status=2  ";
    }
    if (isset(request["search"]["value"]) && request["search"]["value"] != "") {
      flArray = aColumns;
      sWhere += "AND (";
      for (var i = 0; i < flArray.length; i++) {
        sWhere +=
          flArray[i] +
          " LIKE '%" +
          addslashes(request["search"]["value"]) +
          "%' OR ";
      }
      sWhere = substr_replace(sWhere, "", -3);
      sWhere += ")";
    }

    /* Individual column filtering */
    for (i = 0; i < aColumns.length; i++) {
      if (
        isset(request["columns"]) &&
        isset(request["columns"][i]) &&
        request["columns"][i]["searchable"] == "true" &&
        request["columns"][i]["search"]["value"] != ""
      ) {
        if (sWhere == "") {
          sWhere = "WHERE ";
        } else {
          sWhere += " AND ";
        }
        sWhere +=
          aColumns[i] +
          " LIKE '%" +
          addslashes(request["columns"][i]["search"]["value"]) +
          "%' ";
      }
    }

    /*
     * SQL queries
     * Get data to display
     */
    var sQuery =
      "SELECT " +
      aColumns.join(",") +
      " FROM " +
      sTable +
      " " +
      sWhere +
      " " +
      sOrder +
      " " +
      sLimit +
      "";
    var rResult = {};
    var rResultFilterTotal = {};
    var aResultFilterTotal = {};
    var iFilteredTotal = {};
    var iTotal = {};
    var rResultTotal = {};
    var aResultTotal = {};

    appModel.query(sQuery, function (err, rows) {
      if (err) {
        res.send(err);
      } else {
        rResult = rows;
        sQuery =
          "SELECT " +
          aColumns.join(",") +
          " FROM " +
          sTable +
          " " +
          sWhere +
          " " +
          sOrder +
          "";
        appModel.query(sQuery, function (err, rows) {
          if (err) {
            res.send(err);
          } else {
            iFilteredTotal = rows.length;

            sQuery =
              "SELECT COUNT(" +
              sIndexColumn +
              ") as total  FROM " +
              sTable +
              "";

            
                appModel.query(sQuery, function (err, rows) {
                  if (err) {
                    res.send(err);
                  } else {
                    iTotal = rows[0]["total"];
                    //Output
                    var output = {};
                    var temp = [];
                    output.draw = parseInt(request["draw"]);
                    output.recordsTotal = iTotal;
                    output.recordsFiltered = iFilteredTotal;
                    output.data = [];

                    var aRow = rResult;
                    var row = [];
                    var editUrl = "";
                    for (var i in aRow) {
                      temp.push(
                        '<input class="allCheck form-check-input border-blue form-custom-check" type="checkbox" value="">'
                      );
                      for (Field in aRow[i]) {
                        if (Field == "first_name") {
                          var Fullname =
                            aRow[i]["first_name"] + " " + aRow[i]["last_name"];
                          temp.push(Fullname);
                        }
                        if (Field == "first_name") {
                          continue;
                        }
                        if (Field == "last_name") {
                          continue;
                        }
                        if (Field == "createdAt") {
                          var created = dateFormat(
                            aRow[i]["createdAt"],
                            "mmmm dS, yyyy"
                          );
                          temp.push(created);
                        } else if (Field == "status") {
                          if (aRow[i][Field] == "0") {
                            temp.push("Invited");
                          } else if (aRow[i][Field] == "1") {
                            temp.push("Active");
                          } else if (aRow[i][Field] == "2") {
                            temp.push("Archived");
                          }
                        } else if (Field == "id") {
                          temp.push(
                            `<span data-id='${aRow[i][Field]}'><a href="edit-user?id=${aRow[i][Field]}">${aRow[i][Field]}</a></span>`
                          );
                        } else {
                          if (!aRow[i].hasOwnProperty(Field)) continue;
                          temp.push(aRow[i][Field]);
                        }
                      }

                      if (req.query.type == "Invited") {
                        editUrl = `<div class="dropdown"><button class="btn btn-link text-reset dropdown-arrow-none py-0 dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                         <i class="fa-solid fa-ellipsis-vertical"></i>
                                       </button>
                                       <ul class="dropdown-menu shadow rounded-4 border">
                                         <span class="dropdown-menu-arrow"></span>
                                         <li>
                                           <a class="dropdown-item py-2 text-blue d-flex align-items-center" href="#" >
                                             <svg class="me-2" xmlns="http://www.w3.org/2000/svg" width="16.241" height="16.05" viewBox="0 0 22.241 22.05">
                                               <path id="Path" d="M20.159,9.659a.841.841,0,0,0-.841.841A8.818,8.818,0,1,1,10.5,1.683a8.5,8.5,0,0,1,6.241,2.745l-.977-.261a.841.841,0,1,0-.434,1.625l3.263.872.01,0,.018,0a.835.835,0,0,0,.174.023c.008,0,.017,0,.025,0s.041,0,.061,0l.047,0a.856.856,0,0,0,.143-.031l.02-.008a.855.855,0,0,0,.122-.053l.018-.008c.008,0,.013-.01.02-.014s.03-.016.044-.025.022-.02.034-.029a.845.845,0,0,0,.075-.065c.018-.017.034-.034.05-.053a.8.8,0,0,0,.062-.082c.013-.019.025-.038.037-.058a.858.858,0,0,0,.044-.1c.008-.021.017-.04.024-.062a.819.819,0,0,0,.025-.118c0-.014.008-.027.009-.042L20,2.729a.841.841,0,0,0-1.673-.18l-.108,1.007A10.172,10.172,0,0,0,10.5,0,10.5,10.5,0,1,0,21,10.5a.841.841,0,0,0-.841-.841Z" transform="translate(0.525 0.525)" fill="#043072" stroke="#043072" stroke-miterlimit="10" stroke-width="1.05"/>
                                             </svg> Recent
                                         </a>
                                       </li>
                                         <li><a class="dropdown-item py-2 text-blue d-flex align-items-center" href="users/delete/${aRow[i]["id"]}"   title="Delete"  onclick="javascript: return confirmDelete();">
                                           <svg class="me-2" xmlns="http://www.w3.org/2000/svg" width="16" height="16.999" viewBox="0 0 22 22.999">
                                                                              <path id="Combined_Shape" data-name="Combined Shape" d="M16.664,23H5.428a3.117,3.117,0,0,1-2.008-.681A2.865,2.865,0,0,1,2.387,20.1V5.24H1.066a1.049,1.049,0,1,1,0-2.1H1.1c.8-.021,1.614,0,2.417,0h2.71v-.31c0-.163-.005-.33,0-.493A2.39,2.39,0,0,1,6.848.762C7.6-.082,8.675,0,9.692,0h3.036c.256,0,.511-.005.767,0a2.411,2.411,0,0,1,2.2,1.446,3.891,3.891,0,0,1,.186,1.583v.111h5.053A1.077,1.077,0,0,1,22,4.191,1.067,1.067,0,0,1,20.934,5.24H20.9c-.432.011-.866.01-1.3.007V19.566c0,.189.005.382,0,.572A2.925,2.925,0,0,1,16.752,23L16.7,23h-.032ZM5.284,20.919l-.029,0A.084.084,0,0,0,5.284,20.919ZM5.22,20.9H5.3c1.933.031,3.866,0,5.8,0h5.6c.038,0,.072,0,.1,0,.059-.015.118-.032.178-.046l.009,0,.055-.028c.009-.006.066-.037.113-.065l.01-.008c.037-.031.069-.063.1-.094s.044-.047.067-.072c.027-.044.053-.091.056-.1.013-.022.026-.047.039-.072.016-.058.033-.135.042-.174,0-.008,0-.016,0-.026V5.287H4.527c.013,1.443-.015,2.89-.015,4.33V20.143a.386.386,0,0,0,.012.087L4.5,20.165c.012.036.013.087.022.124,0,.009.02.071.036.124l.008.013c.026.047.058.094.085.147l.022.041c.044.045.107.1.15.14l.057.033c.036.023.072.041.1.059a1.4,1.4,0,0,1,.162.046.212.212,0,0,1,.045.008Zm11.956-.157c.025-.016.044-.029.042-.032Zm.1-.085s.023-.024.044-.058C17.305,20.623,17.291,20.642,17.276,20.662ZM4.683,20.634Zm-.059-.083c0,.006.017.031.047.061L4.662,20.6c-.015-.024-.032-.049-.037-.049ZM17.4,20.489c.005,0,.014-.022.024-.056C17.414,20.451,17.406,20.47,17.4,20.489Zm-12.813,0c.006,0-.01-.036-.026-.068A.236.236,0,0,0,4.586,20.489Zm-.052-.118-.006-.011Zm14-15.083ZM8.468,3.143H13.75v-.8c0-.01,0-.018,0-.025l0-.009,0,0a.187.187,0,0,1,0-.024.168.168,0,0,0-.012-.022.093.093,0,0,0,0,.011l0-.012,0-.013c-.007-.011-.016-.03-.025-.048L13.7,2.2c-.018-.016-.063-.044-.087-.061l-.024-.012-.024-.006.008,0-.007,0h-.031L13.516,2.1c-.073-.021-.07-.008-.041,0l.008,0c-.052,0-.108,0-.164,0H8.583l-.015,0-.054.015.018-.008.012-.007h0c-.027,0-.04.008.007,0,.029-.017.029-.026-.068.026h0l-.013,0,0,0h0l0,0a.6.6,0,0,1-.074.071l-.026.044,0,.008,0,.013a.456.456,0,0,0-.007.061v.8Zm5.264-.9-.008-.023-.013-.016A.384.384,0,0,0,13.733,2.247ZM8.4,2.2l.024-.025.016-.015-.008,0c.006-.008.008-.013,0-.015s-.01.009-.02.025a.086.086,0,0,0-.023.017s.007,0,.014,0Zm.055-.055h0ZM4.524,20.23a.323.323,0,0,1,.017.053A.272.272,0,0,1,4.524,20.23Zm7.763-3.121V9.077a1.065,1.065,0,0,1,2.129,0v8.031a1.077,1.077,0,0,1-1.065,1.049H13.31A1.07,1.07,0,0,1,12.287,17.108Zm-4.708,0V9.077a1.065,1.065,0,0,1,2.129,0v8.031a1.077,1.077,0,0,1-1.065,1.049H8.6A1.07,1.07,0,0,1,7.579,17.108ZM13.742,2.279l.007.032A.052.052,0,0,1,13.742,2.279ZM8.416,2.172l.016-.01-.008.01-.016.013Zm.065-.035h0l.031-.008a.181.181,0,0,1-.047.014Zm5-.025h.022l.033,0,.03.009a.081.081,0,0,1-.024,0A.187.187,0,0,1,13.483,2.111Z" transform="translate(0 0)" fill="#043072"/>
                                           </svg> Delete
                                         </a></li>
                                       </ul></div>`;
                      } else if (req.query.type == "Active") {
                        editUrl = `    <div class="dropdown">
                        <button class="btn btn-link text-reset dropdown-arrow-none py-0 dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                          <i class="fa-solid fa-ellipsis-vertical"></i>
                        </button>
                        <ul class="dropdown-menu shadow rounded-4 border">
                          <span class="dropdown-menu-arrow"></span>
                          <li>
                            <a class="dropdown-item py-2 text-blue d-flex align-items-center archiveandactive" data-type="archived" data-id="${aRow[i]["id"]}" href="#">
                              <svg class="me-2" xmlns="http://www.w3.org/2000/svg" width="16.5" height="14.501" viewBox="0 0 22.5 20.501">
                                <path id="Combined_Shape" data-name="Combined Shape" d="M2.539,20a2.545,2.545,0,0,1-1.8-.733A2.465,2.465,0,0,1,0,17.5V5.834H0V5a.824.824,0,0,1,.249-.588L3.985.734A2.543,2.543,0,0,1,5.779,0H16.221a2.54,2.54,0,0,1,1.794.734L21.75,4.413A.821.821,0,0,1,22,5v.832h0V17.5a2.465,2.465,0,0,1-.743,1.768A2.545,2.545,0,0,1,19.462,20Zm-.847-2.5a.836.836,0,0,0,.248.59.852.852,0,0,0,.6.244H19.462a.855.855,0,0,0,.6-.244.835.835,0,0,0,.247-.59V6.667H1.692ZM19.957,5,16.822,1.913a.849.849,0,0,0-.6-.246H5.78a.858.858,0,0,0-.6.246L2.043,5ZM10.869,16.642a.835.835,0,0,1-.148-.046l-.135-.071a1.5,1.5,0,0,1-.123-.1l-2.538-2.5a.826.826,0,0,1-.169-.779.841.841,0,0,1,.572-.562.857.857,0,0,1,.791.166l1.036,1.076V9.167a.832.832,0,0,1,.423-.721.856.856,0,0,1,.847,0,.832.832,0,0,1,.423.721v4.655l1.1-1.076a.856.856,0,0,1,.79-.166.838.838,0,0,1,.571.563.823.823,0,0,1-.168.779l-2.539,2.5a1.352,1.352,0,0,1-.122.1l-.135.071a.884.884,0,0,1-.148.046.773.773,0,0,1-.321,0Z" transform="translate(0.25 0.25)" fill="#043072" stroke="#043072" stroke-miterlimit="10" stroke-width="0.5"/>
                              </svg> Archived
                              
                          </a>
                        </li>
                        <li>
                          <a class="dropdown-item py-2 text-blue d-flex align-items-center" href="edit-user?id=${aRow[i]["id"]}" title="Update">
                            <svg class="me-2" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 21 21">
                              <path id="Shape" d="M2.334,21A2.341,2.341,0,0,1,0,18.666V3.5A2.341,2.341,0,0,1,2.334,1.162H10.5L8.168,3.5H2.334v15.17H17.5V12.831L19.839,10.5v8.168A2.341,2.341,0,0,1,17.5,21Zm5.2-10.875L17.611.052a2.51,2.51,0,0,1,2.43.907,2.511,2.511,0,0,1,.907,2.429L10.873,13.469l-5.038,1.7Z" transform="translate(0 0)" fill="#043072"/>
                            </svg> Edit
                            
                        </a>
                      </li>
                          <li><a class="dropdown-item py-2 text-blue d-flex align-items-center" href="users/delete/${aRow[i]["id"]}"  title="Delete"  onclick="javascript: return confirmDelete();">
                            <svg class="me-2" xmlns="http://www.w3.org/2000/svg" width="16" height="16.999" viewBox="0 0 22 22.999">
                              <path id="Combined_Shape" data-name="Combined Shape" d="M16.664,23H5.428a3.117,3.117,0,0,1-2.008-.681A2.865,2.865,0,0,1,2.387,20.1V5.24H1.066a1.049,1.049,0,1,1,0-2.1H1.1c.8-.021,1.614,0,2.417,0h2.71v-.31c0-.163-.005-.33,0-.493A2.39,2.39,0,0,1,6.848.762C7.6-.082,8.675,0,9.692,0h3.036c.256,0,.511-.005.767,0a2.411,2.411,0,0,1,2.2,1.446,3.891,3.891,0,0,1,.186,1.583v.111h5.053A1.077,1.077,0,0,1,22,4.191,1.067,1.067,0,0,1,20.934,5.24H20.9c-.432.011-.866.01-1.3.007V19.566c0,.189.005.382,0,.572A2.925,2.925,0,0,1,16.752,23L16.7,23h-.032ZM5.284,20.919l-.029,0A.084.084,0,0,0,5.284,20.919ZM5.22,20.9H5.3c1.933.031,3.866,0,5.8,0h5.6c.038,0,.072,0,.1,0,.059-.015.118-.032.178-.046l.009,0,.055-.028c.009-.006.066-.037.113-.065l.01-.008c.037-.031.069-.063.1-.094s.044-.047.067-.072c.027-.044.053-.091.056-.1.013-.022.026-.047.039-.072.016-.058.033-.135.042-.174,0-.008,0-.016,0-.026V5.287H4.527c.013,1.443-.015,2.89-.015,4.33V20.143a.386.386,0,0,0,.012.087L4.5,20.165c.012.036.013.087.022.124,0,.009.02.071.036.124l.008.013c.026.047.058.094.085.147l.022.041c.044.045.107.1.15.14l.057.033c.036.023.072.041.1.059a1.4,1.4,0,0,1,.162.046.212.212,0,0,1,.045.008Zm11.956-.157c.025-.016.044-.029.042-.032Zm.1-.085s.023-.024.044-.058C17.305,20.623,17.291,20.642,17.276,20.662ZM4.683,20.634Zm-.059-.083c0,.006.017.031.047.061L4.662,20.6c-.015-.024-.032-.049-.037-.049ZM17.4,20.489c.005,0,.014-.022.024-.056C17.414,20.451,17.406,20.47,17.4,20.489Zm-12.813,0c.006,0-.01-.036-.026-.068A.236.236,0,0,0,4.586,20.489Zm-.052-.118-.006-.011Zm14-15.083ZM8.468,3.143H13.75v-.8c0-.01,0-.018,0-.025l0-.009,0,0a.187.187,0,0,1,0-.024.168.168,0,0,0-.012-.022.093.093,0,0,0,0,.011l0-.012,0-.013c-.007-.011-.016-.03-.025-.048L13.7,2.2c-.018-.016-.063-.044-.087-.061l-.024-.012-.024-.006.008,0-.007,0h-.031L13.516,2.1c-.073-.021-.07-.008-.041,0l.008,0c-.052,0-.108,0-.164,0H8.583l-.015,0-.054.015.018-.008.012-.007h0c-.027,0-.04.008.007,0,.029-.017.029-.026-.068.026h0l-.013,0,0,0h0l0,0a.6.6,0,0,1-.074.071l-.026.044,0,.008,0,.013a.456.456,0,0,0-.007.061v.8Zm5.264-.9-.008-.023-.013-.016A.384.384,0,0,0,13.733,2.247ZM8.4,2.2l.024-.025.016-.015-.008,0c.006-.008.008-.013,0-.015s-.01.009-.02.025a.086.086,0,0,0-.023.017s.007,0,.014,0Zm.055-.055h0ZM4.524,20.23a.323.323,0,0,1,.017.053A.272.272,0,0,1,4.524,20.23Zm7.763-3.121V9.077a1.065,1.065,0,0,1,2.129,0v8.031a1.077,1.077,0,0,1-1.065,1.049H13.31A1.07,1.07,0,0,1,12.287,17.108Zm-4.708,0V9.077a1.065,1.065,0,0,1,2.129,0v8.031a1.077,1.077,0,0,1-1.065,1.049H8.6A1.07,1.07,0,0,1,7.579,17.108ZM13.742,2.279l.007.032A.052.052,0,0,1,13.742,2.279ZM8.416,2.172l.016-.01-.008.01-.016.013Zm.065-.035h0l.031-.008a.181.181,0,0,1-.047.014Zm5-.025h.022l.033,0,.03.009a.081.081,0,0,1-.024,0A.187.187,0,0,1,13.483,2.111Z" transform="translate(0 0)" fill="#043072"/>
                            </svg> Delete
                          </a></li>
                        </ul>
                      </div>
                     `;
                      } else if (req.query.type == "Archived") {
                        editUrl = `<div class="dropdown"> <button class="btn btn-link text-reset dropdown-arrow-none py-0 dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                          <i class="fa-solid fa-ellipsis-vertical"></i></button><ul class="dropdown-menu shadow rounded-4 border"><span class="dropdown-menu-arrow"></span>
                        <li><a class="dropdown-item py-2 text-blue d-flex align-items-center" href="edit-user?id=${aRow[i]["id"]}" title="Update"><svg class="me-2" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 21 21">
                              <path id="Shape" d="M2.334,21A2.341,2.341,0,0,1,0,18.666V3.5A2.341,2.341,0,0,1,2.334,1.162H10.5L8.168,3.5H2.334v15.17H17.5V12.831L19.839,10.5v8.168A2.341,2.341,0,0,1,17.5,21Zm5.2-10.875L17.611.052a2.51,2.51,0,0,1,2.43.907,2.511,2.511,0,0,1,.907,2.429L10.873,13.469l-5.038,1.7Z" transform="translate(0 0)" fill="#043072"/>
                            </svg> Edit</a>
                      </li>
                          <li><a class="dropdown-item py-2 text-blue d-flex align-items-center" href="users/delete/${aRow[i]["id"]}"  title="Delete"  onclick="javascript: return confirmDelete();">
                            <svg class="me-2" xmlns="http://www.w3.org/2000/svg" width="16" height="16.999" viewBox="0 0 22 22.999">
                              <path id="Combined_Shape" data-name="Combined Shape" d="M16.664,23H5.428a3.117,3.117,0,0,1-2.008-.681A2.865,2.865,0,0,1,2.387,20.1V5.24H1.066a1.049,1.049,0,1,1,0-2.1H1.1c.8-.021,1.614,0,2.417,0h2.71v-.31c0-.163-.005-.33,0-.493A2.39,2.39,0,0,1,6.848.762C7.6-.082,8.675,0,9.692,0h3.036c.256,0,.511-.005.767,0a2.411,2.411,0,0,1,2.2,1.446,3.891,3.891,0,0,1,.186,1.583v.111h5.053A1.077,1.077,0,0,1,22,4.191,1.067,1.067,0,0,1,20.934,5.24H20.9c-.432.011-.866.01-1.3.007V19.566c0,.189.005.382,0,.572A2.925,2.925,0,0,1,16.752,23L16.7,23h-.032ZM5.284,20.919l-.029,0A.084.084,0,0,0,5.284,20.919ZM5.22,20.9H5.3c1.933.031,3.866,0,5.8,0h5.6c.038,0,.072,0,.1,0,.059-.015.118-.032.178-.046l.009,0,.055-.028c.009-.006.066-.037.113-.065l.01-.008c.037-.031.069-.063.1-.094s.044-.047.067-.072c.027-.044.053-.091.056-.1.013-.022.026-.047.039-.072.016-.058.033-.135.042-.174,0-.008,0-.016,0-.026V5.287H4.527c.013,1.443-.015,2.89-.015,4.33V20.143a.386.386,0,0,0,.012.087L4.5,20.165c.012.036.013.087.022.124,0,.009.02.071.036.124l.008.013c.026.047.058.094.085.147l.022.041c.044.045.107.1.15.14l.057.033c.036.023.072.041.1.059a1.4,1.4,0,0,1,.162.046.212.212,0,0,1,.045.008Zm11.956-.157c.025-.016.044-.029.042-.032Zm.1-.085s.023-.024.044-.058C17.305,20.623,17.291,20.642,17.276,20.662ZM4.683,20.634Zm-.059-.083c0,.006.017.031.047.061L4.662,20.6c-.015-.024-.032-.049-.037-.049ZM17.4,20.489c.005,0,.014-.022.024-.056C17.414,20.451,17.406,20.47,17.4,20.489Zm-12.813,0c.006,0-.01-.036-.026-.068A.236.236,0,0,0,4.586,20.489Zm-.052-.118-.006-.011Zm14-15.083ZM8.468,3.143H13.75v-.8c0-.01,0-.018,0-.025l0-.009,0,0a.187.187,0,0,1,0-.024.168.168,0,0,0-.012-.022.093.093,0,0,0,0,.011l0-.012,0-.013c-.007-.011-.016-.03-.025-.048L13.7,2.2c-.018-.016-.063-.044-.087-.061l-.024-.012-.024-.006.008,0-.007,0h-.031L13.516,2.1c-.073-.021-.07-.008-.041,0l.008,0c-.052,0-.108,0-.164,0H8.583l-.015,0-.054.015.018-.008.012-.007h0c-.027,0-.04.008.007,0,.029-.017.029-.026-.068.026h0l-.013,0,0,0h0l0,0a.6.6,0,0,1-.074.071l-.026.044,0,.008,0,.013a.456.456,0,0,0-.007.061v.8Zm5.264-.9-.008-.023-.013-.016A.384.384,0,0,0,13.733,2.247ZM8.4,2.2l.024-.025.016-.015-.008,0c.006-.008.008-.013,0-.015s-.01.009-.02.025a.086.086,0,0,0-.023.017s.007,0,.014,0Zm.055-.055h0ZM4.524,20.23a.323.323,0,0,1,.017.053A.272.272,0,0,1,4.524,20.23Zm7.763-3.121V9.077a1.065,1.065,0,0,1,2.129,0v8.031a1.077,1.077,0,0,1-1.065,1.049H13.31A1.07,1.07,0,0,1,12.287,17.108Zm-4.708,0V9.077a1.065,1.065,0,0,1,2.129,0v8.031a1.077,1.077,0,0,1-1.065,1.049H8.6A1.07,1.07,0,0,1,7.579,17.108ZM13.742,2.279l.007.032A.052.052,0,0,1,13.742,2.279ZM8.416,2.172l.016-.01-.008.01-.016.013Zm.065-.035h0l.031-.008a.181.181,0,0,1-.047.014Zm5-.025h.022l.033,0,.03.009a.081.081,0,0,1-.024,0A.187.187,0,0,1,13.483,2.111Z" transform="translate(0 0)" fill="#043072"/>
                            </svg> Delete
                          </a></li>
                        </ul>
                      </div>`;
                      }

                      // editUrl = '<a href="edit-user?id=' + aRow[i]['id'] + '" title="Update"><i class="btn btn-primary btn-sm fa fa-pencil"></i></a>&nbsp;';
                      // editUrl += '<a href="users/delete/' + aRow[i]['id'] + '" title="Delete"  onclick="javascript: return confirmDelete();"><i class="btn btn-danger fa fa-trash btn-sm"></i></a>';

                      if (req.query.type == "Invited") {
                        temp.push(editUrl);
                        if (temp[temp.length - 2] == "Invited") {
                          temp[temp.length - 2] = "";

                          output.data.push(temp);
                        }
                      } else if (req.query.type == "Active") {
                        temp.push(editUrl);
                        if (temp[temp.length - 2] == "Active") {
                          temp[temp.length - 2] = "";
                          output.data.push(temp);
                        }
                      } else if (req.query.type == "Archived") {
                        temp.push(editUrl);
                        if (temp[temp.length - 2] == "Archived") {
                          temp[temp.length - 2] = "";
                          output.data.push(temp);
                        }
                      }

                      // output.data.push(temp);
                      temp = [];
                    }
                    res.send(output);
                 
              }
            });
          }
        });
      }
    });
  },

  state_ajax: function (req, res, next) {
    request = req.query;
    var aColumns = ["id", "name","abbrev", "status"];
    var sIndexColumn = "id";
    var sTable = "states";

    var sLimit = "";
    if (request["start"] && request["length"] != -1) {
      sLimit = "LIMIT " + request["start"] + ", " + request["length"];
    }

    //Ordering
    var sOrder = "ORDER BY id DESC";
    if (
      isset(request["order"]) &&
      isset(request["order"][0]["dir"]) &&
      trim(request["order"][0]["dir"]) !== ""
    ) {
      sOrder =
        "ORDER BY " +
        aColumns[request["order"][0]["column"]] +
        " " +
        request["order"][0]["dir"];
    }

    /*
     * Filtering
     * NOTE this does not match the built-in DataTables filtering which does it
     * word by word on any field. It's possible to do here, but concerned about efficiency
     * on very large tables, and MySQL's regex functionality is very limited
     */

    var sWhere = "";
    if (isset(request["search"]["value"]) && request["search"]["value"] != "") {
      flArray = aColumns;
      sWhere = "WHERE (";
      for (var i = 0; i < flArray.length; i++) {
        sWhere +=
          flArray[i] +
          " LIKE '%" +
          addslashes(request["search"]["value"]) +
          "%' OR ";
      }
      sWhere = substr_replace(sWhere, "", -3);
      sWhere += ")";
    }

    /* Individual column filtering */
    for (i = 0; i < aColumns.length; i++) {
      if (
        isset(request["columns"]) &&
        isset(request["columns"][i]) &&
        request["columns"][i]["searchable"] == "true" &&
        request["columns"][i]["search"]["value"] != ""
      ) {
        if (sWhere == "") {
          sWhere = "WHERE ";
        } else {
          sWhere += " AND ";
        }
        sWhere +=
          aColumns[i] +
          " LIKE '%" +
          addslashes(request["columns"][i]["search"]["value"]) +
          "%' ";
      }
    }

    /*
     * SQL queries
     * Get data to display
     */
    var sQuery =
      "SELECT " +
      aColumns.join(",") +
      " FROM " +
      sTable +
      " " +
      sWhere +
      " " +
      sOrder +
      " " +
      sLimit +
      "";
    var rResult = {};
    var rResultFilterTotal = {};
    var aResultFilterTotal = {};
    var iFilteredTotal = {};
    var iTotal = {};
    var rResultTotal = {};
    var aResultTotal = {};

    appModel.query(sQuery, function (err, rows) {
      if (err) {
        res.send(err);
      } else {
        rResult = rows;
        sQuery =
          "SELECT " +
          aColumns.join(",") +
          " FROM " +
          sTable +
          " " +
          sWhere +
          " " +
          sOrder +
          "";
        appModel.query(sQuery, function (err, rows) {
          if (err) {
            res.send(err);
          } else {
            iFilteredTotal = rows.length;

            sQuery =
              "SELECT COUNT(" +
              sIndexColumn +
              ") as total  FROM " +
              sTable +
              "";
            appModel.query(sQuery, function (err, rows) {
              if (err) {
                res.send(err);
              } else {
                iTotal = rows[0]["total"];
                //Output
                var output = {};
                var temp = [];
                output.draw = parseInt(request["draw"]);
                output.recordsTotal = iTotal;
                output.recordsFiltered = iFilteredTotal;
                output.data = [];

                var aRow = rResult;
                var row = [];
                var editUrl = "";
                for (var i in aRow) {
                  for (Field in aRow[i]) {
                    if (Field == "id") {
                      continue;
                    } else {
                      if (!aRow[i].hasOwnProperty(Field)) continue;
                      temp.push(aRow[i][Field]);
                    }
                  }
                  if (req.query.type == "active") {
                    if (temp[temp.length - 1] == "1") {
                      temp[temp.length - 1] = "";
                      output.data.push(temp);
                    }
                  } else {
                    if (temp[temp.length - 1] == "0") {
                      temp[temp.length - 1] = "";
                      output.data.push(temp);
                    }
                  }
                  editUrl =
                    '<a href="states/delete/' +
                    aRow[i]["id"] +
                    '" title="Delete"  onclick="javascript: return confirmDelete();">  <i class="fa-regular fa-trash-can text-blue fa-lg cursor-pe"></i></a>';
                  temp.push(editUrl);
                  // output.data.push(temp);
                  temp = [];
                }
                res.send(output);
              }
            });
          }
        });
      }
    });
  },

  tag_ajax: function (req, res, next) {
    request = req.query;
    var aColumns = ["id", "name"];
    var sIndexColumn = "id";
    var sTable = "tags";

    var sLimit = "";
    if (request["start"] && request["length"] != -1) {
      sLimit = "LIMIT " + request["start"] + ", " + request["length"];
    }

    //Ordering
    var sOrder = "ORDER BY id DESC";
    if (
      isset(request["order"]) &&
      isset(request["order"][0]["dir"]) &&
      trim(request["order"][0]["dir"]) !== ""
    ) {
      sOrder =
        "ORDER BY " +
        aColumns[request["order"][0]["column"]] +
        " " +
        request["order"][0]["dir"];
    }

    /*
     * Filtering
     * NOTE this does not match the built-in DataTables filtering which does it
     * word by word on any field. It's possible to do here, but concerned about efficiency
     * on very large tables, and MySQL's regex functionality is very limited
     */

    var sWhere = "";
    if (isset(request["search"]["value"]) && request["search"]["value"] != "") {
      flArray = aColumns;
      sWhere = "WHERE (";
      for (var i = 0; i < flArray.length; i++) {
        sWhere +=
          flArray[i] +
          " LIKE '%" +
          addslashes(request["search"]["value"]) +
          "%' OR ";
      }
      sWhere = substr_replace(sWhere, "", -3);
      sWhere += ")";
    }

    /* Individual column filtering */
    for (i = 0; i < aColumns.length; i++) {
      if (
        isset(request["columns"]) &&
        isset(request["columns"][i]) &&
        request["columns"][i]["searchable"] == "true" &&
        request["columns"][i]["search"]["value"] != ""
      ) {
        if (sWhere == "") {
          sWhere = "WHERE ";
        } else {
          sWhere += " AND ";
        }
        sWhere +=
          aColumns[i] +
          " LIKE '%" +
          addslashes(request["columns"][i]["search"]["value"]) +
          "%' ";
      }
    }

    /*
     * SQL queries
     * Get data to display
     */
    var sQuery =
      "SELECT " +
      aColumns.join(",") +
      " FROM " +
      sTable +
      " " +
      sWhere +
      " " +
      sOrder +
      " " +
      sLimit +
      "";
    var rResult = {};
    var rResultFilterTotal = {};
    var aResultFilterTotal = {};
    var iFilteredTotal = {};
    var iTotal = {};
    var rResultTotal = {};
    var aResultTotal = {};

    appModel.query(sQuery, function (err, rows) {
      if (err) {
        res.send(err);
      } else {
        rResult = rows;
        sQuery =
          "SELECT " +
          aColumns.join(",") +
          " FROM " +
          sTable +
          " " +
          sWhere +
          " " +
          sOrder +
          "";
        appModel.query(sQuery, function (err, rows) {
          if (err) {
            res.send(err);
          } else {
            iFilteredTotal = rows.length;

            sQuery =
              "SELECT COUNT(" +
              sIndexColumn +
              ") as total  FROM " +
              sTable +
              "";
            appModel.query(sQuery, function (err, rows) {
              if (err) {
                res.send(err);
              } else {
                iTotal = rows[0]["total"];
                //Output
                var output = {};
                var temp = [];
                output.draw = parseInt(request["draw"]);
                output.recordsTotal = iTotal;
                output.recordsFiltered = iFilteredTotal;
                output.data = [];

                var aRow = rResult;
                var row = [];
                var editUrl = "";
                for (var i in aRow) {
                  for (Field in aRow[i]) {
                    if (Field == "id") {
                      temp.push(
                        `<span data-id='${aRow[i][Field]}'>${aRow[i][Field]}</span>`
                      );
                    } else {
                      if (!aRow[i].hasOwnProperty(Field)) continue;
                      temp.push(aRow[i][Field]);
                    }
                  }

                  editUrl =
                    '<a href="tags/delete/' +
                    aRow[i]["id"] +
                    '" title="Delete"  onclick="javascript: return confirmDelete();">  <i class="fa-regular fa-trash-can text-blue fa-lg cursor-pe"></i></a>';
                  temp.push(editUrl);
                  output.data.push(temp);
                  temp = [];
                }
                res.send(output);
              }
            });
          }
        });
      }
    });
  },

  campaign_ajax: function (req, res, next) {
    request = req.query;
    var aColumns = ["id", "campaign_name", "status"];
    var sIndexColumn = "id";
    var sTable = "campaign";

    var sLimit = "";
    if (request["start"] && request["length"] != -1) {
      sLimit = "LIMIT " + request["start"] + ", " + request["length"];
    }

    //Ordering
    var sOrder = "ORDER BY id DESC";
    if (
      isset(request["order"]) &&
      isset(request["order"][0]["dir"]) &&
      trim(request["order"][0]["dir"]) !== ""
    ) {
      sOrder =
        "ORDER BY " +
        aColumns[request["order"][0]["column"]] +
        " " +
        request["order"][0]["dir"];
    }

    /*
     * Filtering
     * NOTE this does not match the built-in DataTables filtering which does it
     * word by word on any field. It's possible to do here, but concerned about efficiency
     * on very large tables, and MySQL's regex functionality is very limited
     */

    var sWhere = "";

    if (req.query.type == "active") {
      sWhere = " WHERE status=1  ";
    }else{
      sWhere = " WHERE status=0  ";
    }

    if (isset(request["search"]["value"]) && request["search"]["value"] != "") {
      flArray = aColumns;
      sWhere += "AND (";
      for (var i = 0; i < flArray.length; i++) {
        sWhere +=
          flArray[i] +
          " LIKE '%" +
          addslashes(request["search"]["value"]) +
          "%' OR ";
      }
      sWhere = substr_replace(sWhere, "", -3);
      sWhere += ")";
    }

    /* Individual column filtering */
    for (i = 0; i < aColumns.length; i++) {
      if (
        isset(request["columns"]) &&
        isset(request["columns"][i]) &&
        request["columns"][i]["searchable"] == "true" &&
        request["columns"][i]["search"]["value"] != ""
      ) {
        if (sWhere == "") {
          sWhere = "WHERE ";
        } else {
          sWhere += " AND ";
        }
        sWhere +=
          aColumns[i] +
          " LIKE '%" +
          addslashes(request["columns"][i]["search"]["value"]) +
          "%' ";
      }
    }

    /*
     * SQL queries
     * Get data to display
     */
    var sQuery =
      "SELECT " +
      aColumns.join(",") +
      " FROM " +
      sTable +
      " " +
      sWhere +
      " " +
      sOrder +
      " " +
      sLimit +
      "";
    var rResult = {};
    var rResultFilterTotal = {};
    var aResultFilterTotal = {};
    var iFilteredTotal = {};
    var iTotal = {};
    var rResultTotal = {};
    var aResultTotal = {};

    appModel.query(sQuery, function (err, rows) {
      if (err) {
        res.send(err);
      } else {
        rResult = rows;
        sQuery =
          "SELECT " +
          aColumns.join(",") +
          " FROM " +
          sTable +
          " " +
          sWhere +
          " " +
          sOrder +
          "";
        appModel.query(sQuery, function (err, rows) {
          if (err) {
            res.send(err);
          } else {
            iFilteredTotal = rows.length;

            sQuery =
              "SELECT COUNT(" +
              sIndexColumn +
              ") as total  FROM " +
              sTable +
              "";
            appModel.query(sQuery, function (err, rows) {
              if (err) {
                res.send(err);
              } else {
                iTotal = rows[0]["total"];
                //Output
                var output = {};
                var temp = [];
                output.draw = parseInt(request["draw"]);
                output.recordsTotal = iTotal;
                output.recordsFiltered = iFilteredTotal;
                output.data = [];

                var aRow = rResult;
                var row = [];
                var editUrl = "";
                for (var i in aRow) {
                  for (Field in aRow[i]) {
                    if (Field == "id") {
                      temp.push(
                        `<a style="text-decoration: underline;" href="edit-campaign/${aRow[i].id}">${aRow[i].id}</a>`
                      );
                    } else {
                      if (!aRow[i].hasOwnProperty(Field)) continue;
                      temp.push(aRow[i][Field]);
                    }
                  }

                  if (req.query.type == "active") {
                    if (temp[temp.length - 1] == "1") {
                      temp[
                        temp.length - 1
                      ] = `<span class="ConfirmDelete" data-bs-toggle="modal" data-bs-target="#assignedModalAlert" campname="${aRow[i].campaign_name}" id=${aRow[i]["id"]} href="campaign/delete/${aRow[i]["id"]}" title="Delete">  <i class="fa-regular fa-trash-can text-blue fa-lg cursor-pe"></i></span>`;

                      output.data.push(temp);
                    }
                  } else {
                    if (temp[temp.length - 1] == "0") {
                      temp[
                        temp.length - 1
                      ] = `<span class="ConfirmDelete" data-bs-toggle="modal" data-bs-target="#assignedModalAlert" campname="${aRow[i].campaign_name}" id=${aRow[i]["id"]} href="campaign/delete/${aRow[i]["id"]}" title="Delete">  <i class="fa-regular fa-trash-can text-blue fa-lg cursor-pe"></i></span>`;
                      // temp[temp.length - 1] = ""
                      output.data.push(temp);
                    }
                  }
                  temp = [];
                }
                res.send(output);
              }
            });
          }
        });
      }
    });
  },

  contacts_ajax: function (req, res, next) {
    request = req.query;
    var aColumns = "";

    if (req.query.type == "unassigned" || req.query.type == "DND") {
      aColumns = [
        "id",
        "first_name",
        "last_name",
        "phone_number",
        "email",
        "address",
        "state",
        "campaign",
        "stage",
        "is_contacted",
        "listing_price",
        "city",
        "post_code",
        "created",
        "contact_type",
      ];
    } else if (req.query.type == "assigned") {
      aColumns = [
        "id",
        "first_name",
        "last_name",
        "phone_number",
        "email",
        "address",
        "state",
        "user_fid",
        "campaign",
        "stage",
        "is_contacted",
        "listing_price",
        "city",
        "post_code",
        "created",
        "contact_type",
      ];
    }

    var sIndexColumn = "id";
    var sTable = "contacts";

    var sLimit = "";
    if (request["start"] && request["length"] != -1) {
      sLimit = "LIMIT " + request["start"] + ", " + request["length"];
    }

    //Ordering
    var sOrder = "ORDER BY id DESC";
    if (
      isset(request["order"]) &&
      isset(request["order"][0]["dir"]) &&
      trim(request["order"][0]["dir"]) !== ""
    ) {
      sOrder =
        "ORDER BY " +
        aColumns[request["order"][0]["column"]] +
        " " +
        request["order"][0]["dir"];
    }

    /*
     * Filtering
     * NOTE this does not match the built-in DataTables filtering which does it
     * word by word on any field. It's possible to do here, but concerned about efficiency
     * on very large tables, and MySQL's regex functionality is very limited
     */

    var sWhere = " WHERE contact_type=0 ";

    if (req.query.type == "assigned") {
      sWhere=" WHERE contact_type=1  ";
    }
    else if (req.query.type == "DND") {
      sWhere=" WHERE contact_type=2  ";
    }
    
    if (isset(request["search"]["value"]) && request["search"]["value"] != "") {
      flArray = aColumns;
      sWhere += "AND (";
      for (var i = 0; i < flArray.length; i++) {
        sWhere +=
          flArray[i] +
          " LIKE '%" +
          addslashes(request["search"]["value"]) +
          "%' OR ";
      }
      sWhere = substr_replace(sWhere, "", -3);
      sWhere += ")";
    }

    / Individual column filtering /;
    for (i = 0; i < aColumns.length; i++) {
      if (
        isset(request["columns"]) &&
        isset(request["columns"][i]) &&
        request["columns"][i]["searchable"] == "true" &&
        request["columns"][i]["search"]["value"] != ""
      ) {
        if (sWhere == "") {
          sWhere = "WHERE ";
        } else {
          sWhere += " AND ";
        }
        sWhere +=
          aColumns[i] +
          " LIKE '%" +
          addslashes(request["columns"][i]["search"]["value"]) +
          "%' ";
      }
    }

    /*
     * SQL queries
     * Get data to display
     */
    var sQuery =
      "SELECT " +
      aColumns.join(",") +
      " FROM " +
      sTable +
      " " +
      sWhere +
      " " +
      sOrder +
      " " +
      sLimit +
      "";
    var rResult = {};
    var rResultFilterTotal = {};
    var aResultFilterTotal = {};
    var iFilteredTotal = {};
    var iTotal = {};
    var rResultTotal = {};
    var aResultTotal = {};

    appModel.query(sQuery, function (err, rows) {
      if (err) {
        res.send(err);
      } else {
        rResult = rows;
        sQuery =
          "SELECT " +
          aColumns.join(",") +
          " FROM " +
          sTable +
          " " +
          sWhere +
          " " +
          sOrder +
          "";
        appModel.query(sQuery, function (err, rows) {
          if (err) {
            res.send(err);
          } else {
            iFilteredTotal = rows.length;

            sQuery =
              "SELECT COUNT(" +
              sIndexColumn +
              ") as total  FROM " +
              sTable +
              "";
            appModel.query(sQuery, function (err, rows) {
              if (err) {
                res.send(err);
              } else {
                iTotal = rows[0]["total"];
                //Output
                var output = {};
                var temp = [];
                output.draw = parseInt(request["draw"]);
                output.recordsTotal = iTotal;
                output.recordsFiltered = iFilteredTotal;
                output.data = [];
                let stateData = "select * FROM states";

                var aRow = rResult;
                var row = [];
                var editUrl = "";
                for (var i in aRow) {
                  temp.push(
                    '<input class="allCheck form-check-input border-blue form-custom-check" type="checkbox" value="">'
                  );
                  for (Field in aRow[i]) {
                    if (req.query.type == "assigned") {
                      if (Field == "user_fid") {
                        if (aRow[i][Field] == null) {
                          temp.push("No Agent");
                          continue;
                        } else {
                          var users_id = aRow[i][Field];
                          temp.push(users_id);
                        }
                      }
                    }

                    if (Field == "created") {
                      var created = dateFormat(
                        aRow[i]["created"],
                        "mmmm dS, yyyy"
                      );
                      temp.push(created);
                    } else if (Field == "status") {
                      continue;
                      // if (aRow[i][Field] == "1") {
                      //   temp.push("<span class='activeUser' style='color: green;'>Active</span>");
                      // } else {
                      //   temp.push("<span class='activeUser'>Unassigned</span>");
                      // }
                    } else if (Field == "id") {
                      temp.push(
                        `<span data-id='${aRow[i][Field]}'><a style="text-decoration: underline;" href="contacts/edit-contact/${aRow[i].id}">${aRow[i].id}</a></span>`
                      );
                    } else if (Field == "user_fid") {
                      continue;
                    } else if (Field == "created") {
                      var created = dateFormat(
                        aRow[i]["created"],
                        "dS, yyyy, h:MM:ss TT"
                      );
                      temp.push(created);
                    } else {
                      if (!aRow[i].hasOwnProperty(Field)) continue;
                      temp.push(aRow[i][Field]);
                    }
                  }
                  //editUrl = '<a href="edit-user/' + aRow[i]['id'] + '" title="Update"><i class="btn btn-primary btn-sm fa fa-pencil"></i></a>&nbsp;';
                  // editUrl += '<a href="users/delete/' + aRow[i]['id'] + '" title="Delete"  onclick="javascript: return confirmDelete();"><i class="btn btn-danger fa fa-trash btn-sm"></i></a>';
                  // temp.push(editUrl);
                  if (req.query.type == "unassigned") {
                    if (temp[temp.length - 1] == "0") {
                      output.data.push(temp);
                    }
                  } else if (req.query.type == "assigned") {
                    if (temp[temp.length - 1] == "1") {
                      output.data.push(temp);
                    }
                  } else if (req.query.type == "DND") {
                    if (temp[temp.length - 1] == "2") {
                      output.data.push(temp);
                    }
                  }
                  temp = [];
                }
                res.send(output);
              }
            });
          }
        });
      }
    });
  },

  contactagent_ajax: function (req, res, next) {
    request = req.query;
    var aColumns = [
      "id",
      "first_name",
      "last_name",
    ];

    var sIndexColumn = "id";
    var sTable = "users as u";

    var sLimit = "";
    if (request["start"] && request["length"] != -1) {
      sLimit = "LIMIT " + request["start"] + ", " + request["length"];
    }

    //Ordering
    var sOrder = "ORDER BY id DESC";
    if (
      isset(request["order"]) &&
      isset(request["order"][0]["dir"]) &&
      trim(request["order"][0]["dir"]) !== ""
    ) {
      sOrder =
        "ORDER BY " +
        aColumns[request["order"][0]["column"]] +
        " " +
        request["order"][0]["dir"];
    }

    /*
     * Filtering
     * NOTE this does not match the built-in DataTables filtering which does it
     * word by word on any field. It's possible to do here, but concerned about efficiency
     * on very large tables, and MySQL's regex functionality is very limited
     */

    var sWhere = ''
    if (isset(request["search"]["value"]) && request["search"]["value"] != "") {
      flArray = aColumns;
      sWhere += "Where (";
      for (var i = 0; i < flArray.length; i++) {
        sWhere +=
          flArray[i] +
          " LIKE '%" +
          addslashes(request["search"]["value"]) +
          "%' OR ";
      }
      sWhere = substr_replace(sWhere, "", -3);
      sWhere += ")";
    }

    /* Individual column filtering */
    for (i = 0; i < aColumns.length; i++) {
      if (
        isset(request["columns"]) &&
        isset(request["columns"][i]) &&
        request["columns"][i]["searchable"] == "true" &&
        request["columns"][i]["search"]["value"] != ""
      ) {
        if (sWhere == "") {
          sWhere = "WHERE ";
        } else {
          sWhere += " AND ";
        }
        sWhere +=
          aColumns[i] +
          " LIKE '%" +
          addslashes(request["columns"][i]["search"]["value"]) +
          "%' ";
      }
    }

    /*
     * SQL queries
     * Get data to display
     */
    var sQuery =
      "SELECT " +
      aColumns.join(",") +
      " FROM " +
      sTable +
      " " +
      sWhere +
      " " +
      sOrder +
      " " +
      sLimit +
      "";
    var rResult = {};
    var rResultFilterTotal = {};
    var aResultFilterTotal = {};
    var iFilteredTotal = {};
    var iTotal = {};
    var rResultTotal = {};
    var aResultTotal = {};

    appModel.query(sQuery, function (err, rows) {
      if (err) {
        res.send(err);
      } else {
        rResult = rows;
        sQuery =
          "SELECT " +
          aColumns.join(",") +
          " FROM " +
          sTable +
          " " +
          sWhere +
          " " +
          sOrder +
          "";
        appModel.query(sQuery, function (err, rows) {
          if (err) {
            res.send(err);
          } else {
            iFilteredTotal = rows.length;

            sQuery =
              "SELECT COUNT(" +
              sIndexColumn +
              ") as total  FROM " +
              sTable +
              "";


            appModel.query(sQuery, function (err, rows) {
              if (err) {
                res.send(err);
              } else {
                iTotal = rows[0]["total"];
                //Output
                var output = {};
                var temp = [];
                output.draw = parseInt(request["draw"]);
                output.recordsTotal = iTotal;
                output.recordsFiltered = iFilteredTotal;
                output.data = [];

                var aRow = rResult;
                var row = [];
                var editUrl = "";
                for (var i in aRow) {

                  temp.push(
                    `<input class="form-check-input assign_checked border-blue form-custom-check mt-0"  name="select_assigned" type="checkbox" id="${aRow[i]['id']}" value="${aRow[i]['id']}" aria-label="...">`
                  );
                  for (Field in aRow[i]) {
                    if (Field == "first_name") {
                      var Fullname =
                        `
                        <div class= "col-sm-12">
                        <div class= "row">
                        <div class="col-sm-3">
                          <span style="background-color: #40A36A;"
                          class="d-flex align-items-center justify-content-center rounded-circle sm-wh flex-shrink-0 text-white text-uppercase mx-2 mx-xl-3 fs-14">
                          ${aRow[i]['first_name'][0]}
                          ${aRow[i]['last_name'][0]}
                        </span>
                        </div>
                        <div class="col-sm-9">`+ aRow[i]["first_name"] + " " + aRow[i]["last_name"] + `</div>
                      </div>
                      </div>
                    `;
                      temp.push(Fullname);
                    }
                    if (Field == "last_name") {
                      continue;
                    }
                  }
                  output.data.push(temp);
                  temp = [];
                }
                res.send(output);
              }
            });
          }
        });
      }
    });
  },

  message_ajax: function (req, res, next) {
    request = req.query;
    var aColumns = ["id", "opportunities", "message_type", "message"];
    var sIndexColumn = "id";
    var sTable = "messages";

    var sLimit = "";
    if (request["start"] && request["length"] != -1) {
      sLimit = "LIMIT " + request["start"] + ", " + request["length"];
    }

    //Ordering
    var sOrder = "ORDER BY id DESC";
    if (
      isset(request["order"]) &&
      isset(request["order"][0]["dir"]) &&
      trim(request["order"][0]["dir"]) !== ""
    ) {
      sOrder =
        "ORDER BY " +
        aColumns[request["order"][0]["column"]] +
        " " +
        request["order"][0]["dir"];
    }

    /*
     * Filtering
     * NOTE this does not match the built-in DataTables filtering which does it
     * word by word on any field. It's possible to do here, but concerned about efficiency
     * on very large tables, and MySQL's regex functionality is very limited
     */

    var sWhere = "";
    if (isset(request["search"]["value"]) && request["search"]["value"] != "") {
      flArray = aColumns;
      sWhere = "WHERE (";
      for (var i = 0; i < flArray.length; i++) {
        sWhere +=
          flArray[i] +
          " LIKE '%" +
          addslashes(request["search"]["value"]) +
          "%' OR ";
      }
      sWhere = substr_replace(sWhere, "", -3);
      sWhere += ")";
    }

    /* Individual column filtering */
    for (i = 0; i < aColumns.length; i++) {
      if (
        isset(request["columns"]) &&
        isset(request["columns"][i]) &&
        request["columns"][i]["searchable"] == "true" &&
        request["columns"][i]["search"]["value"] != ""
      ) {
        if (sWhere == "") {
          sWhere = "WHERE ";
        } else {
          sWhere += " AND ";
        }
        sWhere +=
          aColumns[i] +
          " LIKE '%" +
          addslashes(request["columns"][i]["search"]["value"]) +
          "%' ";
      }
    }

    /*
     * SQL queries
     * Get data to display
     */
    var sQuery =
      "SELECT " +
      aColumns.join(",") +
      " FROM " +
      sTable +
      " " +
      sWhere +
      " " +
      sOrder +
      " " +
      sLimit +
      "";
    var rResult = {};
    var rResultFilterTotal = {};
    var aResultFilterTotal = {};
    var iFilteredTotal = {};
    var iTotal = {};
    var rResultTotal = {};
    var aResultTotal = {};

    appModel.query(sQuery, function (err, rows) {
      if (err) {
        res.send(err);
      } else {
        rResult = rows;
        sQuery =
          "SELECT " +
          aColumns.join(",") +
          " FROM " +
          sTable +
          " " +
          sWhere +
          " " +
          sOrder +
          "";
        appModel.query(sQuery, function (err, rows) {
          if (err) {
            res.send(err);
          } else {
            iFilteredTotal = rows.length;

            sQuery =
              "SELECT COUNT(" +
              sIndexColumn +
              ") as total  FROM " +
              sTable +
              "";
            appModel.query(sQuery, function (err, rows) {
              if (err) {
                res.send(err);
              } else {
                iTotal = rows[0]["total"];
                //Output
                var output = {};
                var temp = [];
                output.draw = parseInt(request["draw"]);
                output.recordsTotal = iTotal;
                output.recordsFiltered = iFilteredTotal;
                output.data = [];

                var aRow = rResult;
                var row = [];
                var editUrl = "";
                for (var i in aRow) {
                  for (Field in aRow[i]) {
                    if (Field == "id") {
                      temp.push(`<a style="text-decoration: underline;" href="edit-messages/${aRow[i].id}">${aRow[i].id}</a>`)
                    }
                    // else  if (Field == "message_type") {
                    //  continue;
                    // } 
                    else {
                      if (!aRow[i].hasOwnProperty(Field)) continue;
                      temp.push(aRow[i][Field]);
                    }
                  }

                  editUrl = `
                  <ul class="list-inline text-nowrap mb-0">
                  <li class="list-inline-item">
                  <span class="ConfirmDelete" data-bs-toggle="modal" data-bs-target="#assignedModalAlert" opportunities="${aRow[i].opportunities}" id=${aRow[i]["id"]} href="messages/delete/${aRow[i]["id"]}" title="Delete"><i class="fa-regular fa-trash-can text-blue fa-lg cursor-pe"></i></span>
                    
                  </li>
                </ul>`;
                  temp.push(editUrl);
                  output.data.push(temp);

                  temp = [];
                }
                res.send(output);
              }
            });
          }
        });
      }
    });
  },
  
  
  opportunities_ajax: function (req, res, next) {
    request = req.query;

    var aColumns = [
      "id",
      "name",
      "pipeline",
      "opp_stage",
      "lead_value",
      "owner",
      "source",
       "status",
      "tags",
      "company_name",
     
    ];
    // "(SELECT GROUP_CONCAT(abbrev SEPARATOR ', ') from states WHERE FIND_IN_SET(abbrev,u.state)) as state",

    var sIndexColumn = "id";
    var sTable = "opportunities";

    var sLimit = "";
    if (request["start"] && request["length"] != -1) {
      sLimit = "LIMIT " + request["start"] + ", " + request["length"];
    }

    //Ordering
    var sOrder = "ORDER BY id DESC";
    if (
      isset(request["order"]) &&
      isset(request["order"][0]["dir"]) &&
      trim(request["order"][0]["dir"]) !== ""
    ) {
      sOrder =
        "ORDER BY " +
        aColumns[request["order"][0]["column"]] +
        " " +
        request["order"][0]["dir"];
    }

    /*
     * Filtering
     * NOTE this does not match the built-in DataTables filtering which does it
     * word by word on any field. It's possible to do here, but concerned about efficiency
     * on very large tables, and MySQL's regex functionality is very limited
     */
 var sWhere;
    if (req.query.type == "newopportunities") {
      sWhere = " WHERE opp_stage='new_opportunities' ";
    } 
    else if (req.query.type == "months") {
      sWhere = " WHERE opp_stage='3 Months'  ";
    }
    else if (req.query.type == "follow") {
      sWhere = " WHERE opp_stage='Follow Up'  ";
    }
    else if (req.query.type == "underwriten") {
      sWhere = " WHERE opp_stage='Underwriten'  ";
    }
    else if (req.query.type == "deal") {
      sWhere = " WHERE opp_stage='Deal started'  ";
    }
    else if (req.query.type == "no_opportunities") {
      sWhere = " WHERE opp_stage='No Opportunities'  ";
    }
    if (isset(request["search"]["value"]) && request["search"]["value"] != "") {
      flArray = aColumns;
      sWhere += "AND (";
      for (var i = 0; i < flArray.length; i++) {
        sWhere +=
          flArray[i] +
          " LIKE '%" +
          addslashes(request["search"]["value"]) +
          "%' OR ";
      }
      sWhere = substr_replace(sWhere, "", -3);
      sWhere += ")";
    }

    /* Individual column filtering */
    for (i = 0; i < aColumns.length; i++) {
      if (
        isset(request["columns"]) &&
        isset(request["columns"][i]) &&
        request["columns"][i]["searchable"] == "true" &&
        request["columns"][i]["search"]["value"] != ""
      ) {
        if (sWhere == "") {
          sWhere = "WHERE ";
        } else {
          sWhere += " AND ";
        }
        sWhere +=
          aColumns[i] +
          " LIKE '%" +
          addslashes(request["columns"][i]["search"]["value"]) +
          "%' ";
      }
    }

    /*
     * SQL queries
     * Get data to display
     */
    var sQuery =
      "SELECT " +
      aColumns.join(",") +
      " FROM " +
      sTable +
      " " +
      sWhere +
      " " +
      sOrder +
      " " +
      sLimit +
      "";
    var rResult = {};
    var rResultFilterTotal = {};
    var aResultFilterTotal = {};
    var iFilteredTotal = {};
    var iTotal = {};
    var rResultTotal = {};
    var aResultTotal = {};

    appModel.query(sQuery, function (err, rows) {
      if (err) {
        res.send(err);
      } else {
        rResult = rows;
        sQuery =
          "SELECT " +
          aColumns.join(",") +
          " FROM " +
          sTable +
          " " +
          sWhere +
          " " +
          sOrder +
          "";
        appModel.query(sQuery, function (err, rows) {
          if (err) {
            res.send(err);
          } else {
            iFilteredTotal = rows.length;

            sQuery =
              "SELECT COUNT(" +
              sIndexColumn +
              ") as total  FROM " +
              sTable +
              "";

            appModel.query(sQuery, function (err, rows) {
              if (err) {
                res.send(err);
              } else {
                iTotal = rows[0]["total"];
                //Output
                var output = {};
                var temp = [];
                output.draw = parseInt(request["draw"]);
                output.recordsTotal = iTotal;
                output.recordsFiltered = iFilteredTotal;
                output.data = [];

                var aRow = rResult;
                var row = [];
                var editUrl = "";
                for (var i in aRow) {
                  temp.push(
                    '<input class="allCheck form-check-input border-blue form-custom-check" type="checkbox" value="">'
                  );
                  for (Field in aRow[i]) {
                    if (Field == "id") {
                      temp.push( `<span data-id='${aRow[i][Field]}'><a href="edit-opportunities?id=${aRow[i].id}">${aRow[i].id}</a></span>`);
                     
                    }else if (Field == "Tags") {
                      continue;
                    } 
                     else if (Field == "Company Name") {
                      continue;
                    }  else {
                      if (!aRow[i].hasOwnProperty(Field)) continue;
                      temp.push(aRow[i][Field]);
                    }
                  }
                 
                  if (req.query.type == "newopportunities") {
                     
                    if (temp[temp.length - 7] == "new_opportunities") {
                      output.data.push(temp);
                    }
                  } else if (req.query.type == "months") {
                  
                    if (temp[temp.length - 7] == "3 Months") {
                      output.data.push(temp);
                    }
                  } else if (req.query.type == "follow") {
                    
                    if (temp[temp.length - 7] == "Follow Up") {
                      output.data.push(temp);
                    }
                  } else if (req.query.type == "underwriten") {
                    
                    if (temp[temp.length - 7] == "Underwriten") {
                      output.data.push(temp);
                    }
                  } else if (req.query.type == "deal") {
                    
                    if (temp[temp.length - 7] == "Deal Started") {
                      output.data.push(temp);
                    }
                  } else if (req.query.type == "no_opportunities") {
                  
                    if (temp[temp.length - 7] == "No Opportunities") {
                      output.data.push(temp);
                    }
                  }

                  temp = [];
                }
                res.send(output);
              }
            });
          }
        });
      }
    });
  },
};
