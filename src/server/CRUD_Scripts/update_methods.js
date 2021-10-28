module.exports = {

  update_: async function (fs,ent_man,entry_lookup,pool,request,response) {

    var determine_update = request.body;

    switch(determine_update.action_item){

      case "edit_profile":
        //Update the database and Entry Manager

        try{
          ////Updating Profile Database
          conn = await pool.query("UPDATE user_profile SET\
          contact_name = ?,\
          company_name = ?,\
          position_title = ?,\
          management_grade = ?,\
          business_address = ?,\
          business_country = ?,\
          business_size = ?,\
          business_revenue = ?,\
          phone_id = ?,\
          industry = ? WHERE username = ?",
          [
            JSON.stringify({"First_Name":determine_update.First_Name,"Last_Name":determine_update.Last_Name}),
            determine_update.Company,
            determine_update.Title,
            determine_update.Management_Grade,
            determine_update.Address,
            determine_update.Country,
            determine_update.Size,
            determine_update.Revenue,
            determine_update.Phone,
            determine_update.Industry,
            determine_update.username
          ]);

          ////Buyer/Supplier Table
          conn2 = await pool.query("UPDATE " + determine_update.Buyer_or_Supplier + "s_table SET\
          contact_name = ?,\
          company_name = ?,\
          position_title = ?,\
          business_address = ?,\
          business_country = ?,\
          business_size = ?,\
          business_revenue = ?,\
          phone_id = ?,\
          industry = ? WHERE username = ?",
          [
            JSON.stringify({"First_Name":determine_update.First_Name,"Last_Name":determine_update.Last_Name}),
            determine_update.Company,
            determine_update.Title,
            determine_update.Address,
            determine_update.Country,
            determine_update.Size,
            determine_update.Revenue,
            determine_update.Phone,
            determine_update.Industry,
            determine_update.username
          ]);

          ////Updating Entry Manager
          Object.keys(entry_lookup[determine_update.username]).forEach(entry_id => {
            //"entry_id" is the entry id
            var page_num = entry_lookup[determine_update.username][entry_id] // page number
            
            ent_man[page_num][entry_id].contact_name = JSON.stringify({"First_Name":determine_update.First_Name,"Last_Name":determine_update.Last_Name});
            ent_man[page_num][entry_id].company_name = determine_update.Company;
            ent_man[page_num][entry_id].position_title = determine_update.Title;
            ent_man[page_num][entry_id].business_address = determine_update.Address;
            ent_man[page_num][entry_id].business_country = determine_update.Country;
            ent_man[page_num][entry_id].business_size = determine_update.Size;
            ent_man[page_num][entry_id].business_revenue = determine_update.Revenue;
            ent_man[page_num][entry_id].phone_id = determine_update.Phone;
            ent_man[page_num][entry_id].industry = determine_update.Industry;

          });

          response.json({"statusmsg":"db_success"});
          
        }
        catch(err){

          response.json({"statusmsg":"db_failure"});
          console.log(err);

        }
        break;

      case "edititem":

        var page_num = entry_lookup[determine_update.username][determine_update.entry_id];

        //Buyer or Supplier Updating One of its Entries
        if (determine_update.Buyer_or_Supplier == 'buyer'){
          
          try{
            //First update the database of the entry
            conn = await pool.query("UPDATE buyers_table SET\
            request_title = ?,\
            request_text = ?,\
            location_request_from = ?,\
            send_item_to = ? WHERE entry_id = ?",
            [
              determine_update.Title,
              determine_update.Description,
              determine_update.Location,
              determine_update.Shipping,
              determine_update.entry_id
            ]);

            //Then update the entry manager        
            ent_man[page_num][determine_update.entry_id].request_title = determine_update.Title;
            ent_man[page_num][determine_update.entry_id].request_text = determine_update.Description;
            ent_man[page_num][determine_update.entry_id].location_request_from = determine_update.Location;
            ent_man[page_num][determine_update.entry_id].send_item_to = determine_update.Shipping;

            response.json({"statusmsg":"db_success"});

            return;
          }
          catch(err){
            response.json({"statusmsg":"db_failure"});
            console.log(err);
          }

        }

        if (determine_update.Buyer_or_Supplier == 'supplier'){
          try{
            
            if(request.files != null){

              //Delete the current photo for the entry from the entry manager
              fs.unlinkSync('./User_info' + ent_man[page_num][determine_update.entry_id].product_pictures)

              //Then Replace/Update photo location in the entry manager
              var filepath = '/' + determine_update.username + '/' + request.files.Item_Photo.name + '_' + determine_update.entry_id; //folder file path
              ent_man[page_num][determine_update.entry_id].product_pictures = filepath;

              //Then actually put the photo in the filesystem and add to database
              request.files.Item_Photo.mv('./User_info' + filepath, async function(err){

                if (err) {
                  console.log(err);
                  response.json({statusmsg:"db_failure"});
                  return;
                }

                conn = await pool.query("UPDATE suppliers_table SET product_pictures = ? WHERE entry_id = ?",[filepath,determine_update.entry_id]);

              });

            }
            
            //Then update the rest of the details as normal
            //First update the database of the entry
            conn2 = await pool.query("UPDATE suppliers_table SET\
            product_title = ?,\
            product_description = ?,\
            product_location = ?,\
            shipping_options = ? WHERE entry_id = ?",
            [
              determine_update.Title,
              determine_update.Description,
              determine_update.Location,
              determine_update.Shipping,
              determine_update.entry_id
            ]);

            //Then update the entry manager        
            ent_man[page_num][determine_update.entry_id].product_title = determine_update.Title;
            ent_man[page_num][determine_update.entry_id].product_description = determine_update.Description;
            ent_man[page_num][determine_update.entry_id].product_location = determine_update.Location;
            ent_man[page_num][determine_update.entry_id].shipping_options = determine_update.Shipping;

            response.json({"statusmsg":"db_success"});

            return;

          }
          catch{
            response.json({"statusmsg":"db_failure"});
            console.log(err);
          }
        }

        break;

    }
	
  }

};

