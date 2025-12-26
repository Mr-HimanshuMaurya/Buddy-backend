import { Router } from "express";
import { submitContact, submitEnquiry, getDetails, deleteContact } from "../controllers/contact.controller.js";

const router = Router();

router.route("/contact").post(submitContact);
router.route("/enquiry").post(submitEnquiry);
router.route("/contact/details").get(getDetails);
router.delete("/contact/details/:id", deleteContact);

export default router;
