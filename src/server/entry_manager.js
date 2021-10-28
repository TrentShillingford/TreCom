module.exports = {

  retrieve_entry_manager: function () {
    const entry_manager = {
      "1": {},
      obj_keys: [1],
      add: function(obj){    
        //The current last key for this map
        var ind = this.obj_keys.length.toString();
        var last = this[ind]; // ex: this['3'] if 3 is the highest key
    
        //Add entry to the latest key
        last[obj.entry_id] = obj; 
    
        //Then check if the size of the latest key is over 20
        if(Object.keys(last).length >= 3){    
          var new_int = this.obj_keys.length + 1; //getting current length
          this.obj_keys.push(new_int) //adding incremented integer into the array
          this[new_int.toString()] = {}; //create new empty object with incremented integer to add a new page
        } 

        return ind.toString();                       
      },
      display: function(curr){
    
        //TODO
        var curr_page = this[this.obj_keys[curr-1].toString()]; // ex: this['5']
        return curr_page;
    
      }
    }

    return entry_manager;
  }

};
