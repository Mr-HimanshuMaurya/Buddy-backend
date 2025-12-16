import express from "express";
import {
  createProperty,
  getAllProperties,
  getPropertyById,
  getPropertyBySlug,
  updateProperty,
  deleteProperty,
  searchProperties,
  getPropertiesByOwner,
  getNearbyProperties,
} from "../controllers/property.controller.js";

const router = express.Router();

router.post("/", createProperty);
router.get("/", getAllProperties);
router.get("/search", searchProperties);
router.get("/nearby", getNearbyProperties);
router.get("/owner/:ownerId", getPropertiesByOwner);
router.get("/slug/:slug", getPropertyBySlug);
router.get("/:id", getPropertyById);
router.put("/:id", updateProperty);
router.delete("/:id", deleteProperty);

export default router;

