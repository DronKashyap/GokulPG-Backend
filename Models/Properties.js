const mongoose = require('mongoose');
const autoIncrement = require('mongoose-plugin-autoinc').autoIncrement;


const PropertySchema = new mongoose.Schema(
  {
    PgName: {
      type: String,
      required: false,
      default:"Co-Living PG"
    },
    PgLocation: {
      type: String,
      required: true,
    },
    PrivateRoomPrice: {
      type: Number,
      required:true,
    },
    DoubleSeaterRoomPrice: {
        type: Number,
        required:true,
      },
    TripleSeaterRoomPrice: {
        type: Number,
        required:true,
      },
    ImageUrls: {
      type: [String],
      required: false,
      default:[],
    },
  
  },
  { timestamps: true }
);
PropertySchema.plugin(autoIncrement, {
    model: 'Property',
    field: 'PropertyNumber',
    startAt: 1,
    incrementBy: 1,
});

// Create Property model
const Property = mongoose.model('Property', PropertySchema);



module.exports = { Property };

