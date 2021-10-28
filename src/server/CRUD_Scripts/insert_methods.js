//const mariadb = require('mariadb');

module.exports = {
  insert_: async function (ent_man,entry_lookup,pool,request,response) {

    var determine_insert = request.body;

    switch(request.body.action_item) {

      case "register":

        try {

          //adding the new user profile into the user_profile database
          conn = await pool.query( "INSERT INTO user_profile VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
          [
           determine_insert.Profile_ID, 
           determine_insert.Buyer_or_Supplier, 
           JSON.stringify(determine_insert.Name),
           determine_insert.Company_Name,
           determine_insert.Position_Title,
           determine_insert.Management_Grade,
           determine_insert.Email,
           determine_insert.Phone,
           determine_insert.Business_Address,
           determine_insert.Business_Country,
           determine_insert.Business_Size,
           determine_insert.Business_Revenue,
           determine_insert.Industry,
           determine_insert.Username,
           determine_insert.Password,
           "offline"
          ]);

          //creating a new user in the entry_lookup
          entry_lookup[determine_insert.Username] = {};
          
          response.json({statusmsg:"db_success"})
          return;

        } 
        catch(err) {
          throw err;
        } 

        break;

      case "additem":
      
        // from here, use Date.now() for timestamp and append to photos and .txt files for uniqueness
        var unique_id = Date.now();
        
        if(determine_insert.Buyer_or_Supplier == "supplier"){
          //Capture the filepath in a variable for storing in buyer/supplier database
          var filepath = '/' + determine_insert.username + '/' + request.files.Item_Photo.name + '_' + unique_id; //Adding photo to file folder here
          //var filepath = './User_info/' + determine_insert.username + '/' + request.files.Item_Photo.name + '_' + unique_id; //Adding photo to file folder here

          request.files.Item_Photo.mv('./User_info' + filepath, async function(err){ // <==== do some work here
            
            if (err) {
              console.log(err);
              response.json({statusmsg:"db_failure"});
              return;
            }
          

            try{
              //Add information to the buyer/supplier database if uploading to folder is successful
              //First get all information about the buyer/supplier from the user_profile database
              conn = await pool.query("SELECT * FROM user_profile WHERE username=?", [request.body.username]);

              //"conn['0']" is the json with the user_profile data
              //Do conditional on whether the user is a buyer or supplier and act accoridingly
            
              await pool.query( "INSERT INTO suppliers_table VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
              [
                conn['0'].profile_id,  
                unique_id.toString(),
                conn['0'].username,        
                conn['0'].contact_name,        
                conn['0'].company_name,       
                conn['0'].position_title,      
                conn['0'].business_address,
                conn['0'].business_country,    
                conn['0'].business_size,       
                conn['0'].business_revenue,    
                conn['0'].industry,            
                conn['0'].email_id,           
                conn['0'].phone_id,          
                request.body.Title,
                request.body.Description,
                request.body.Location,    
                request.body.Shipping,    
                filepath
              ]);

              //add the entry to the entry manager and save the page number for this entry
              entry_lookup[conn['0'].username][unique_id.toString()] = ent_man.add({
                "email_id": conn['0'].email_id,
                "phone_id": conn['0'].phone_id,
                "company_name": conn['0'].company_name,
                "contact_name": conn['0'].contact_name,
                "entry_id": unique_id.toString(),
                "product_title": request.body.Title,
                "product_location": request.body.Location,
                "shipping_options": request.body.Shipping,
                "product_description": request.body.Description,
                "business_address": conn['0'].business_address,
                "business_country": conn['0'].business_country,
                "business_size": conn['0'].business_size,
                "business_revenue": conn['0'].business_revenue,
                "username": conn['0'].username,
                "product_pictures": filepath
              });

              response.json({
                "statusmsg":"db_success",
                "entry_id":unique_id.toString(),
                "company_name":conn['0'].company_name,
                "business_size":conn['0'].business_size,
                "business_revenue":conn['0'].business_revenue,
                "contact_name":conn['0'].contact_name,
                "username":conn['0'].username,
                "email_id":conn['0'].email_id,
                "phone_id":conn['0'].phone_id,
                "photo":filepath
              });
              return;
            }
            catch(err) {
              throw err;
            }             
          });
        }

        if(determine_insert.Buyer_or_Supplier == "buyer"){
          //Buyer Handling Move Here Instead
          //Buyer handling

          try{
            conn = await pool.query("SELECT * FROM user_profile WHERE username=?", [request.body.username]);
            await pool.query( "INSERT INTO buyers_table VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
            [
              conn['0'].profile_id,
              unique_id.toString(),
              conn['0'].username,         
              conn['0'].contact_name,        
              conn['0'].company_name,       
              conn['0'].position_title,
              conn['0'].email_id,           
              conn['0'].phone_id,       
              conn['0'].business_address,
              conn['0'].business_country,
              conn['0'].business_size,
              conn['0'].business_revenue,
              conn['0'].industry,
              request.body.Location,
              request.body.Shipping,                
              request.body.Title,
              request.body.Description
            ]);

            //add the entry to the entry manager
            entry_lookup[conn['0'].username][unique_id.toString()] = ent_man.add({
              "username":conn['0'].username,
              "email_id": conn['0'].email_id,
              "phone_id": conn['0'].phone_id,
              "company_name": conn['0'].company_name,
              "contact_name": conn['0'].contact_name,
              "business_country": conn['0'].business_country,
              "business_size":conn['0'].business_size,
              "business_revenue":conn['0'].business_revenue,
              "entry_id": unique_id.toString(),
              "request_title": request.body.Title,
              "location_request_from": request.body.Location,
              "send_item_to": request.body.Shipping,
              "request_text": request.body.Description
            })

            response.json({
              "statusmsg":"db_success",
              "entry_id":unique_id.toString(),
              "username":conn['0'].username,
              "company_name":conn['0'].company_name,
              "business_country": conn['0'].business_country,
              "business_size":conn['0'].business_size,
              "business_revenue":conn['0'].business_revenue,
              "contact_name":conn['0'].contact_name,
              "username":conn['0'].username,
              "email_id":conn['0'].email_id,
              "phone_id":conn['0'].phone_id
            });            
            return;
          }
          catch(err){
            throw err;
          }        
        }
        break; 
    }
    return;        
  }
};



/*pool
   .query("SELECT NOW()")
   .then(rows => {
    console.log(rows); //[ { 'NOW()': 2018-07-02T17:06:38.000Z }, meta: [ ... ] ]
   })
   .catch(err => {
    //handle error
   });*/