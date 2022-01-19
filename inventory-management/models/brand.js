var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var BrandSchema = new Schema(
  {
    brand_name: { type: String, required: true }
  }
);

BrandSchema
  .virtual('url')
  .get(function() {
    return '/inventory/brand/' + this._id;
  });

module.exports = mongoose.model('BrandModel', BrandSchema);