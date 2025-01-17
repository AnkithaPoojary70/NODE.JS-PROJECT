
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Cities route' });
});

module.exports = router;
// City Schema
const citySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    population: {
        type: Number,
        required: true,
        min: 0
    },
    country: {
        type: String,
        required: true,
        trim: true
    },
    latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90
    },
    longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const City = mongoose.model('City', citySchema);


router.post('/cities', async (req, res) => {
    try {
        const { name, population, country, latitude, longitude } = req.body;
        

        const existingCity = await City.findOne({ name });
        if (existingCity) {
            return res.status(400).json({
                success: false,
                message: 'City with this name already exists'
            });
        }

        const city = new City({
            name,
            population,
            country,
            latitude,
            longitude
        });

        await city.save();

        res.status(201).json({
            success: true,
            message: 'City added successfully',
            data: city
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding city',
            error: error.message
        });
    }
});

// Update City API
router.put('/cities/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

       
        if (updates.name) {
            const existingCity = await City.findOne({
                name: updates.name,
                _id: { $ne: id }
            });
            if (existingCity) {
                return res.status(400).json({
                    success: false,
                    message: 'City with this name already exists'
                });
            }
        }

        const city = await City.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!city) {
            return res.status(404).json({
                success: false,
                message: 'City not found'
            });
        }

        res.json({
            success: true,
            message: 'City updated successfully',
            data: city
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating city',
            error: error.message
        });
    }
});

// Delete City API
router.delete('/cities/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const city = await City.findByIdAndDelete(id);

        if (!city) {
            return res.status(404).json({
                success: false,
                message: 'City not found'
            });
        }

        res.json({
            success: true,
            message: 'City deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting city',
            error: error.message
        });
    }
});

// Get Cities API
router.get('/cities', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            filter,
            sort,
            search,
            fields
        } = req.query;

        // Build query
        let query = City.find();

        // Apply search
        if (search) {
            query = query.or([
                { name: new RegExp(search, 'i') },
                { country: new RegExp(search, 'i') }
            ]);
        }

        // Apply filters
        if (filter) {
            const filterObj = JSON.parse(filter);
            query = query.where(filterObj);
        }

        // Apply sort
        if (sort) {
            const sortObj = JSON.parse(sort);
            query = query.sort(sortObj);
        }

        // Apply projection
        if (fields) {
            const fieldsList = fields.split(',').join(' ');
            query = query.select(fieldsList);
        }

        // Apply pagination
        const skip = (page - 1) * limit;
        query = query.skip(skip).limit(parseInt(limit));

        // Execute query
        const [cities, total] = await Promise.all([
            query.exec(),
            City.countDocuments(query.getFilter())
        ]);

        res.json({
            success: true,
            data: cities,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving cities',
            error: error.message
        });
    }
});

module.exports = router;