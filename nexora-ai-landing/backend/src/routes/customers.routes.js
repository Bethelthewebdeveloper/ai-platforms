import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { createCustomer, deleteCustomer, listCustomers, updateCustomer } from "../controllers/customers.controller.js";

const router = express.Router();
router.use(protect);
router.get("/", listCustomers);
router.post("/", createCustomer);
router.patch("/:customerId", updateCustomer);
router.delete("/:customerId", deleteCustomer);
export default router;
