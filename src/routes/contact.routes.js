import { Router } from "express";
import { submitContact, submitEnquiry, getDetails } from "../controllers/contact.controller.js";

const router = Router();

router.route("/contact").post(submitContact);
router.route("/enquiry").post(submitEnquiry);
router.route("/details").get(getDetails);

export default router;
