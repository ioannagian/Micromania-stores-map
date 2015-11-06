Session.setDefault('list', []);


Meteor.startup(function() {  
  GoogleMaps.load({v: '3', key: 'AIzaSyDh1p2GxTb5KnRFXkV9yCCrUBLJpHfgdnQ', libraries: 'drawing,places'});
});


Template.export.helpers({  
  counter: function(){
    return Session.get('list').length;
  },
});



Template.export.events({

  "click #download" : function(event){

    var list = Session.get('list');

    var addresses = [];	
	
	// get objects from database
	for(var i = 0; i < list.length; i++){
		var store = Markers.findOne({ _id: list[i] });
		var open =  store.opening_hours ? "Yes"  : "No";
		addresses.push({Address : store.formatted_address, "Open Now" : open});
	}

	// transform to csv and export file
	csv = json2csv( addresses, true, true );
    event.target.href = "data:text/csv;charset=utf-8," + escape(csv);
	event.target.download = "stores.csv";

  },

	"click #clear" : function(event){
		// empty list and refresh page
		Session.set('list', []);
		Meteor._reload.reload();
	},

});



Template.map.helpers({  
  mapOptions: function() {
    if (GoogleMaps.loaded()) {
      return {
		// Paris area
        center: new google.maps.LatLng(48.8529436,2.355059),
        zoom: 11
      };
    }
  }
});


Template.map.onCreated(function() {


	GoogleMaps.ready('map', function(map) {

		// Specify location, radius and place types for the Places API search.
		var request = {
			location: new google.maps.LatLng(48.8529436,2.355059),
			radius: '500',
			types: ['store'],
			query: 'micromania'
		};

		var service = new google.maps.places.PlacesService(map.instance);

		service.textSearch(request, function(results, status) {

			// if response
			if (status == google.maps.places.PlacesServiceStatus.OK) {

				var 
				default_icon =  {
									url: "http://www.google.com/mapfiles/marker.png", // url
									origin: new google.maps.Point(0,0), // origin
								},
				green_icon   =  {
									url: "http://www.google.com/mapfiles/marker_green.png", // url
									origin: new google.maps.Point(0,0), // origin
							 	};



				for (var i = 0; i < results.length; i++) {
					
					var place = results[i];

					try {
					// using the unique place_id from the google Places API
						Markers.upsert({ _id: place.place_id.toString() }, place);
					} 
					catch (e) {
						console.log('catch e: '+e);
					}      

					// If the request succeeds, draw the place location on
					// the map as a marker, and register an event to handle a
					// click on the marker.
					var marker = new google.maps.Marker({
								map: map.instance,
								position: place.geometry.location,
								_id: place.place_id,
								icon: default_icon,
					});

					

					marker.addListener('click', function() {

						var 
						list = Session.get('list'),
						ind	 = list.indexOf(this._id);
						
						// if item is already selected, remove it from selection
						if(ind != -1) {
							console.log("removed");
							this.setIcon(default_icon);
							list.splice(ind, 1);
							
						}
						// if item is not selected, add it from selection
						else{
							console.log("added");
							this.setIcon(green_icon);
							list.push(this._id);
							
						}

						Session.set('list', list);
					});
					
					
				}
				
				
			}
		});
	});
});
