var Brand = require('../models/brand');
var Item = require('../models/item');
var async = require('async');
var mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');

/* Retrieve and display a list of all brands in the database */
exports.brand_list = function(req, res, next) {
  Brand.find({}, 'brand_name')
  .collation({ locale: "en", caseLevel: true})
  .sort({brand_name: 1})
  .exec(function (err, list_brands) {
    if (err) { return next(err); }
    res.render('brand_list', {title: 'Brands' , brand_list: list_brands});
  });
};

/* Retrieve and display all items of a specific brand given an id */
exports.brand_detail = function(req, res, next) {
  var id = mongoose.Types.ObjectId(req.params.id);
  async.parallel({
    brand: function(callback) {
      Brand.findById(id)
        .exec(callback);
    },
    brand_items: function(callback) {
      Item.find({'brand': id}, 'name brand count')
        .collation({ locale: "en", caseLevel: true})
        .sort({name: 1})
        .exec(callback);
    },
  }, function(err, results) {
    if (err) { return next(err); }
    if (results.brand == null) {
      var err = new Error('Brand not Found');
      err.status = 404;
      return next(err);
    }
    res.render('brand_detail', {brand: results.brand, brand_items: results.brand_items});
  });
};

/* Renders form to create a brand */
exports.brand_create_get = function(req, res, next) {
  res.render('brand_form', {title: 'Create a brand'});
};

/* Create and save a new brand given brand_name */
exports.brand_create_post = [
  body('brand_name', 'Brand name is required.').trim().isLength({ min: 1 }).escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    var brand = new Brand( { brand_name: req.body.brand_name } );
    if(!errors.isEmpty()) {
      res.render('brand_form', {title: 'Create a brand.', brand: brand, errors: errors.array()});
      return;
    } else {
      Brand.findOne({ 'brand_name': req.body.brand_name })
        .exec(function(err, found){
          if(err) { return next(err); }
          if(found) {
            res.redirect(found.url);
          } else {
            brand.save(function (err) {
              if (err) { return next(err); }
              res.redirect(brand.url)
            });
          }
        });

    }
  }
];

/* Renders form to edit a brand, pre-loads all existing data for the brand given an id */
exports.brand_update_get = function(req, res, next) {
  var id = mongoose.Types.ObjectId(req.params.id);
  Brand.findById(id, function(err, brand) {
    if (err) { return next(err); }
    if (brand == null) {
      var err = new Error('Brand not found.');
      err.status = 404;
      return next(err);
    }
    res.render('brand_form', {title: 'Edit brand', brand: brand});
  });
};

/* Edits a brand given a new brand name. Renders the brand's detail page after */
exports.brand_update_post = [
  body('brand_name', 'Brand name is required.').trim().isLength({ min: 1 }).escape(),
  (req, res, next) => {
    var id = mongoose.Types.ObjectId(req.params.id);
    const errors = validationResult(req);
    var brand = new Brand(
      { 
        brand_name: req.body.brand_name,
        _id: id
      });
    if(!errors.isEmpty()) {
      res.render('brand_form', {title: 'Edit brand', brand: brand, errors: errors.array()});
      return;
    } else {
      Brand.findByIdAndUpdate(id, brand, {}, function (err, brand_updated){
        if (err) { return next(err) }
        res.redirect(brand_updated.url);
      });
    }
  }
];

/* Renders the deletion screen for a brand given an id 
   Needs to load all items associated with a brand so brands are not deleted
   with items associated to them. */
exports.brand_delete_get = function(req, res, next) {
  var id = mongoose.Types.ObjectId(req.params.id);
  async.parallel({
    brand: function(callback) {
      Brand.findById(id).exec(callback)
    },
    brand_items: function(callback) {
      Item.find({ 'brand': id}).exec(callback)
    },
  }, function(err, results) {
    if (err) { return next(err); }
    if (results.brand==null) {
      res.redirect('/inventory/brands')
    }
    res.render('brand_delete', {title: 'Delete brand', brand: results.brand, brand_items: results.brand_items});
  });
};

/* Deletes a brand given an id, ensures no items are associated to brand */
exports.brand_delete_post = function(req, res, next) {
  var id = mongoose.Types.ObjectId(req.body.brand_id);
  async.parallel({
    brand: function(callback) {
      Brand.findById(id).exec(callback)
    },
    brand_items: function(callback) {
      Item.find({ 'brand': id }).exec(callback)
    },
  }, function(err, results) {
    if (err) { return next(err); }
    if (results.brand_items.length > 0) {
      res.render('brand_delete', {title: 'Delete brand', brand: results.brand, brand_items: results.brand_items});
      return;
    } else {
      Brand.findByIdAndRemove(id, function deleteBrand(err) {
        if (err) { return next(err); }
        res.redirect('/inventory/brands');
      })
    }
  });
};