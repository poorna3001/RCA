"""
Root Cause Explorer Backend - Production
Categorized Exception Target Parser with Multi-Variant Comment Injection
"""
from flask import Flask, jsonify, request, send_file, Response
from flask_cors import CORS
import psycopg2
from sqlalchemy import create_engine, text
import pandas as pd
import io
import math
import json
import csv
import random
import traceback

app = Flask(__name__)
CORS(app)
SCHEMA_NAME = "oats" 

# Secure Engine Setup
engine = create_engine(
    "postgresql://neondb_owner:npg_5wQeyoh4pxFT@ep-fragrant-dawn-at7nzvqv.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require",
    connect_args={"options": f"-csearch_path={SCHEMA_NAME}"}
)

# --- MASTER CONFIGURATION DICTIONARY WITH YOUR EXACT TABLE NAMES ---
AUDIT_RISK_MAP = {
    "PO Price Higher Contract": {
        "category": "Procure to Pay",
        "description": "Purchase Orders raised with reference to a contract but at a price exceeding the contracted price, leading to financial loss and potential fraud.",
        "table_candidates": ["procurement_higher_contract"],
        "value_candidates": ["PriceDiff", "pricediff", "price_diff", "FinalImpact"],
        "cats": [
            {"name": "Market & Vendor Constraints", "sub1": "Vendor Price Hike", "sub2": "Spot Buy Prevents Shutdown"},
            {"name": "Master Data & Process Lag", "sub1": "Pending Rate Update", "sub2": "Delayed Contract Doc"},
            {"name": "System Flexibility Gaps", "sub1": "Missing Hard Block", "sub2": "Volatile Freight Tolerance"}
        ]
    },
    "Unplanned Delivery Cost > 5%": {
        "category": "Procure to Pay",
        "description": "Invoices paid in excess of the approved PO value through use of 'unplanned delivery cost' feature or manual surcharges, leading to financial loss.",
        "table_candidates": [ "sjin13_unplanned_delivery"],
        "value_candidates": ["Unplanned Delivery Cost", "unplanned_delivery_cost", "DeliveryCost_Local", "delivery_costs"],
        "cats": [
            {"name": "Logistics & Operational Reality", "sub1": "Expedited Shipping", "sub2": "Unforeseen Port Charges"},
            {"name": "System & Workflow Configuration", "sub1": "Supply Chain Tolerance", "sub2": "Missing Excess Workflow"},
            {"name": "Vendor Billing Practices", "sub1": "Combined Shipment Surcharge", "sub2": "Fuel Hike Surcharge"}
        ]
    },
    "MSME Vendor Payment Delay Risk": {
        "category": "Procure to Pay",
        "description": "Delayed payment to MSME vendors resulting in non-compliance to MSME Act, 2006.",
        "table_candidates": ["sjpa7_msme_penalty"],
        "value_candidates": ["INTEREST_ON_DELAYED_PAYMENT_TO_MSME_(@3 TIMES THE BANK RATE)", "AMOUNT", "amount", "interest_on_delayed_payment_to_msme_"],
        "cats": [
            {"name": "Cash Flow & Prioritization", "sub1": "Cash Flow Constraints", "sub2": "Critical Vendor Priority"},
            {"name": "Master Data & Documentation", "sub1": "Missing MSME Flag", "sub2": "Late MSME Cert"},
            {"name": "Process Disconnects", "sub1": "Transit Delay to AP", "sub2": "Quality Dispute Hold"}
        ]
    },
    "PO Terms Amended After Goods Receipt": {
        "category": "Procure to Pay",
        "description": "PO terms amended after goods received, enabling retroactive fraud.",
        "table_candidates": ["po_terms_changed"],
        "value_candidates": ["Net value", "Net Value", "net_value"],
        "cats": [
            {"name": "Invoice & Tax Alignment", "sub1": "Invoice Tax Sync", "sub2": "Delivered Qty Sync"},
            {"name": "Commercial Adjustments", "sub1": "Post-Delivery Discount", "sub2": "Late Freight Finalization"},
            {"name": "System & Approval Constraints", "sub1": "SAP Correction Allowed", "sub2": "Approval Bottleneck Bypass"}
        ]
    },
    "PO Split Risk": {
        "category": "Procure to Pay",
        "description": "Purchase Orders deliberately split below approval thresholds to circumvent Delegation of Authority, enabling unauthorised procurement.",
        "table_candidates": ["po_split"],
        "value_candidates": ["Net Order Value", "Net value", "Net Value", "net_value"],
        "cats": [
            {"name": "Budget & Phasing Realities", "sub1": "Phased Budget Release", "sub2": "Urgent Scope Expansion"},
            {"name": "Approval & Lead Time Bottlenecks", "sub1": "Local Approval Routing", "sub2": "Urgent Sign-off Bypass"},
            {"name": "System Grouping Limitations", "sub1": "Requisition Grouping Fail", "sub2": "No Aggregate Spend View"}
        ]
    },
    "Vendor Bank Account Changed Risk": {
        "category": "Procure to Pay",
        "description": "Vendor bank account changed to a fraudulent account for payment then reinstated to original account after payment, concealing the fraud.",
        "table_candidates": ["bank_account_changed"],
        "value_candidates": ["Amount", "amount"],
        "cats": [
            {"name": "Vendor Banking Issues", "sub1": "Vendor Account Maintenance", "sub2": "Subsidiary Routing Request"},
            {"name": "Master Data & Turnaround Urgency", "sub1": "Urgent Checker Bypass", "sub2": "Verbal Vendor Confirmation"},
            {"name": "System Alerting Gaps", "sub1": "Unintegrated Change Log", "sub2": "Missing Rapid Change Alert"}
        ]
    },
    "Sales Return Qty Exceeds Original": {
        "category": "Order to Cash",
        "description": "Sales return quantities at batch/customer level exceed the original sales quantity, indicating fraudulent returns or revenue manipulation.",
        "table_candidates": ["cjsa23_sales_return_qty"],
        "value_candidates": ["Difference (Sales - Sales Return)", "Sales Return Quantity (Sum)", "target_quantity"],
        "cats": [
            {"name": "Customer Dispute Resolution", "sub1": "Consolidated Past Returns", "sub2": "Strategic Client Goodwill"},
            {"name": "Documentation & Sync Gaps", "sub1": "Pending Return GR", "sub2": "Verbal Sales Auth"},
            {"name": "System Validation Limits", "sub1": "No Batch Validation", "sub2": "Unlinked Return Order"}
        ]
    },
    "Sales Return Price Greater Than Original": {
        "category": "Order to Cash",
        "description": "Sales returns credited at price greater than original sales price, inflating credit notes and reducing revenue.",
        "table_candidates": ["sales_return_price_mismatch"],
        "value_candidates": ["Price Mismatch", "Net Value", "Net value", "net_value"],
        "cats": [
            {"name": "Commercial Compensation", "sub1": "Customer Penalty Comp", "sub2": "Market Rate Settlement"},
            {"name": "Process Exigencies", "sub1": "Expedited Refund Entry", "sub2": "Spanning Price Credit"},
            {"name": "System Configuration", "sub1": "No Return Tolerance", "sub2": "Unlocked Source Pricing"}
        ]
    },
    "Multiple Sales Returns Risk": {
        "category": "Order to Cash",
        "description": "Multiple sales returns raised against the same original invoice or customer within a short time window indicate potential return fraud, manipulation of sales volumes, or exploitation of the returns process.",
        "table_candidates": ["multiple_sales_return"],
        "value_candidates": ["Net Value", "Net value", "net_value"],
        "cats": [
            {"name": "Product & Transit Issues", "sub1": "Staggered Damage Returns", "sub2": "Phased Batch Recall"},
            {"name": "Customer Behavior Constraints", "sub1": "Small Batch Returns", "sub2": "Customer Space Limits"},
            {"name": "System & Monitoring Gaps", "sub1": "No Invoice Return Limit", "sub2": "Missing Frequency Report"}
        ]
    },
    "Sales Return Immediate Risk": {
        "category": "Order to Cash",
        "description": "Sales returns processed immediately (same day or within 1–3 days of the original invoice date) indicate potential circular transactions, goods never actually dispatched, or collusion between sales and warehouse teams.",
        "table_candidates": ["sales_return_im"],
        "value_candidates": ["Net Value", "Net value", "Amount in LC", "amount_in_lc"],
        "cats": [
            {"name": "Logistics & Dispatch Corrections", "sub1": "Wrong Dispatch Reversal", "sub2": "In-Transit Cancellation"},
            {"name": "Customer Service Speed", "sub1": "Quick Billing Correction", "sub2": "Rapid Service Policy"},
            {"name": "System Alerts", "sub1": "Unrestricted Same-Day Return", "sub2": "No Reversal Alert"}
        ]
    },
    "Sales Return After 180 Days Risk": {
        "category": "Order to Cash",
        "description": "Sales returns raised more than 180 days after the original invoice date expose the company to inflated credit note exposure, acceptance of fully depreciated or expired goods, fictitious reversal of old revenue, and non-compliance with contractual return windows.",
        "table_candidates": ["sales_return_180"],
        "value_candidates": ["Diff Latest Sale And Return", "Forward Return", "Net value", "Net Value"],
        "cats": [
            {"name": "Commercial Relationship Management", "sub1": "Key Distributor Exception", "sub2": "Partner Liquidity Support"},
            {"name": "Product Lifecycle Realities", "sub1": "Expired Goods Practice", "sub2": "Extended Warranty Claim"},
            {"name": "System & Inspection Bypasses", "sub1": "Missing 180-Day Block", "sub2": "Low Value Bypass"}
        ]
    },
    "Duplicate Customers Risk": {
        "category": "Order to Cash",
        "description": "Duplicate Customers in the system leading to data inconsistencies and potential fraud.",
        "table_candidates": ["duplicate_customers"],
        "value_candidates": ["sum_of_all_transactions", "no_of_duplicates"],
        "cats": [
            {"name": "Organizational & Legacy Data", "sub1": "Cross-Vertical Customer", "sub2": "Legacy System Migration"},
            {"name": "Master Data & Turnaround Urgency", "sub1": "Urgent Creation Bypass", "sub2": "No Data Cleansing"},
            {"name": "System Deduplication Limits", "sub1": "Name Variant Failure", "sub2": "Missing Tax ID Check"}
        ]
    },
    "FOC Unauthorised Discount Risk": {
        "category": "Order to Cash",
        "description": "Goods sold at zero or nominal value without proper authorisation lead to revenue loss and potential collusion with customers.",
        "table_candidates": ["cjsa22_foc_discount"],
        "value_candidates": ["Net Value", "Net value", "Billed Quantity"],
        "cats": [
            {"name": "Marketing & Sales Promos", "sub1": "Competitor Match FOC", "sub2": "Product Launch Samples"},
            {"name": "Inventory Management Needs", "sub1": "Expiry Liquidation", "sub2": "Damage Write-Off"},
            {"name": "System & Authorization Gaps", "sub1": "Missing FOC Workflow", "sub2": "Offline Management Auth"}
        ]
    },
    "Scrap Sales Risk": {
        "category": "Scrap Management",
        "description": "Scrap Sales without proper authorization or valuation leading to revenue leakage.",
        "table_candidates": ["scrap_sales"],
        "value_candidates": ["Net Value", "Net value", "Impact"],
        "cats": [
            {"name": "Operational Urgency", "sub1": "Yard Clearance Priority", "sub2": "No Time for Quotes"},
            {"name": "Material Classification Issues", "sub1": "Off-Spec Downgrade", "sub2": "Estimated Weight"},
            {"name": "Process & Governance Delays", "sub1": "Volatile Scrap Rates", "sub2": "Committee Meeting Delay"}
        ]
    },
    "Actual vs Standard Yield Loss Risk": {
        "category": "Inventory Management",
        "description": "Actual yield losses in manufacturing significantly deviate from standard yield losses defined in the BOM/routing without investigation, leading to undetected material wastage or diversion.",
        "table_candidates": ["mjt06_yield_loss"],
        "value_candidates": ["Standard_Yield_Loss", "Actual yield (confirmed)", "yield_variance"],
        "cats": [
            {"name": "Production & Material Realities", "sub1": "Variable RM Quality", "sub2": "Aging Machine Efficiency"},
            {"name": "Master Data Lag", "sub1": "Outdated BOM Yield", "sub2": "Delayed Routing Update"},
            {"name": "Monitoring Limitations", "sub1": "Infrequent Variance Review", "sub2": "No Yield Analyst on Shift"}
        ]
    },
    "Reorder Level Breach Risk": {
        "category": "Inventory Management",
        "description": "Procurement occurs for materials where existing inventory already exceeds reorder level, leading to excess stock and high carrying costs.",
        "table_candidates": ["reorder_level"],
        "value_candidates": ["Available Quantity", "Stock as on PO date", "value_unrestricted"],
        "cats": [
            {"name": "Supply Chain Strategy", "sub1": "Strategic Bulk Buy", "sub2": "Shortage Hedging"},
            {"name": "Planning & MRP Lags", "sub1": "Stale MRP Signals", "sub2": "Outdated Safety Stock"},
            {"name": "System & Alert Gaps", "sub1": "Unrestricted PO Creation", "sub2": "Missing Overstock Dashboard"}
        ]
    },
    "Finished Goods Dispatched Without QI": {
        "category": "Quality Management",
        "description": "Finished goods are dispatched without adequate final quality inspection, leading to customer complaints and returns.",
        "table_candidates": ["finished_goods_dispatched_wo_qi"],
        "value_candidates": ["Amount in LC", "amount_in_lc"],
        "cats": [
            {"name": "Commercial & Delivery Urgency", "sub1": "Urgent Dispatch Bypass", "sub2": "Month-End Revenue Release"},
            {"name": "Process & Resource Bottlenecks", "sub1": "QA Lab Down", "sub2": "Night Shift QC Shortage"},
            {"name": "System Configuration Gaps", "sub1": "Missing QI Delivery Block", "sub2": "Incorrect Auto-UD"}
        ]
    },
    "QA Rejected Issued to Prod": {
        "category": "Quality Management",
        "description": "Expired, quality-rejected or quality-hold materials issued for production or dispatched to market, leading to product safety failures and regulatory non-compliance.",
        "table_candidates": ["cjs1_quality_rejected"],
        "value_candidates": ["Distinct_count", "Distinct count", "New_value"],
        "cats": [
            {"name": "Production Urgency & Salvage", "sub1": "Salvaged Batch Use", "sub2": "Conditional Release"},
            {"name": "Process & Communication Failures", "sub1": "Missing Physical Tag", "sub2": "Stock Rotation Failure"},
            {"name": "System Enforcements", "sub1": "Unblocked Storage Issue", "sub2": "No FEFO Enforcement"}
        ]
    },
    "TDS at Incorrect Rate Risk": {
        "category": "Taxation",
        "description": "TDS deducted at rates other than the applicable statutory rate for the vendor/transaction type leading to non-compliance.",
        "table_candidates": ["tds_insight"],
        "value_candidates": ["Amount", "amount", "Amount in Loc. Curr."],
        "cats": [
            {"name": "Ambiguity & Interpretation", "sub1": "Ambiguous Service Type", "sub2": "Wrong Vendor Cert"},
            {"name": "Master Data Lag", "sub1": "Outdated Vendor TDS", "sub2": "User TDS Adjustment"},
            {"name": "Process & Volume Constraints", "sub1": "High Volume Bypass", "sub2": "Delayed 26AS Recon"}
        ]
    },
    "Ineligible ITC Claim Risk": {
        "category": "Taxation",
        "description": "Ineligible ITC may be claimed leading to regulatory exposure.",
        "table_candidates": ["gst_working"],
        "value_candidates": ["Diff in IGST", "diff_in_igst"],
        "cats": [
            {"name": "Vendor Compliance Issues", "sub1": "Late Vendor GSTR-1", "sub2": "Retroactive Vendor Cancel"},
            {"name": "Process & Interpretation", "sub1": "Ambiguous Blocked Credit", "sub2": "Delayed 180-Day Tracking"},
            {"name": "System & Automation Gaps", "sub1": "Wrong Tax Code Mapping", "sub2": "Missing Auto Recon Tool"}
        ]
    },
    "Inadequate SAP Database Security": {
        "category": "Cyber Security",
        "description": "Inadequate database security (weak passwords, excessive file permissions, insecure configuration settings) exposes the SAP database to unauthorised access and data manipulation.",
        "table_candidates": ["password_test"],
        "value_candidates": ["Last Password Changed", "days_since_last_change"],
        "cats": [
            {"name": "Operational Needs & Legacy", "sub1": "Night Shift Broad Access", "sub2": "Legacy Profile Retention"},
            {"name": "Resource Constraints", "sub1": "No SAP Basis Team", "sub2": "Relaxed Password Policy"},
            {"name": "System Limitations", "sub1": "Custom T-Code Requirements", "sub2": "Third-Party Default Acct"}
        ]
    },
    "Direct Changes to SAP Risk": {
        "category": "Cyber Security",
        "description": "Direct Changes to SAP without proper authorization or documentation.",
        "table_candidates": ["direct_changes_sap"],
        "value_candidates": ["Old Value", "New Value"],
        "cats": [
            {"name": "Critical Incident Resolution", "sub1": "Month-End Dump Fix", "sub2": "P1 Transport Bypass"},
            {"name": "Process Exigencies", "sub1": "Emergency Config Request", "sub2": "Direct Correction Applied"},
            {"name": "Controls & Logging Backlogs", "sub1": "Delayed Log Review", "sub2": "Open Debug Access"}
        ]
    }
}

# Mock comments - ONLY used when database comment column is empty or NULL
MOCK_COMMENTS_MAP = {
    "Vendor Price Hike": ["Vendor rate change applied due to market conditions.", "Unilateral price hike by supplier.", "Price adjusted by supplier without prior notice."],
    "Spot Buy Prevents Shutdown": ["Spot buy executed to prevent operational shutdown.", "Emergency fallback spot purchase authorized.", "Authorized offline saver buy for critical material."],
    "Pending Rate Update": ["Price pending master data sync.", "Rate amendment cycle lag detected.", "Awaiting system tariff reload."],
    "Delayed Contract Doc": ["Contract document upload delayed in system.", "Admin documentation filing delay.", "Portal contract upload pending."],
    "Missing Hard Block": ["Access warning bypassed in system.", "System hard restriction skipped.", "Block bypassed via managerial override."],
    "Volatile Freight Tolerance": ["Fuel index margin breach detected.", "Unstable delivery variance logged.", "Freight tolerance limit alert triggered."],
    "Expedited Shipping": ["Premium air cargo used for urgent delivery.", "Expedited courier dispatch logged.", "Fast-tracked logistics route approved."],
    "Unforeseen Port Charges": ["Port demurrage charges applied.", "Terminal storage penalty logged.", "Customs clearance lookup fee applied."],
    "Supply Chain Tolerance": ["Tolerance margin expanded for this order.", "Sequence buffer adjusted high.", "Staging tolerance updated."],
    "Missing Excess Workflow": ["Over-limit signoff missing in workflow.", "Workflow tier check skipped.", "Excess budget loop missing."],
    "Combined Shipment Surcharge": ["Unified shipping bundle cost applied.", "Shipments combined on invoice.", "Consolidated transport surcharge."],
    "Fuel Hike Surcharge": ["Oil index price adjustment applied.", "Dynamic fuel fee applied.", "Supplier diesel surcharge entry."],
    "Cash Flow Constraints": ["Settlement window extended due to cash flow.", "Timeline adjusted for liquidity.", "Disbursement delay approved."],
    "Critical Vendor Priority": ["Tier-1 critical provider clearance.", "Priority vendor queue release.", "Fast-tracked partner payout."],
    "Missing MSME Flag": ["Missing vendor MSME tag in system.", "Micro-enterprise tag unmapped.", "Entity profiling classification lag."],
    "Late MSME Cert": ["MSME certificate provided late.", "Delayed active entity filing.", "Verification certificate past due."],
    "Transit Delay to AP": ["Physical invoice transit lag.", "Document delivery delayed.", "Mailroom routing processing lag."],
    "Quality Dispute Hold": ["QC failure block active.", "Hold ordered: item test variance.", "Sub-standard parameter hold."],
    "Invoice Tax Sync": ["Manual PO edit for tax sync.", "PO reset to match invoice.", "Recalculated line adjustment applied."],
    "Delivered Qty Sync": ["Aligned to warehouse receipts.", "Adjusted to actual arrival counts.", "Slips override batch target."],
    "Post-Delivery Discount": ["Retroactive volume credit applied.", "Post-facto supplier rebate credit.", "Bulk discount voucher mapped."],
    "Late Freight Finalization": ["Freight value post-closing update.", "Ancillary transit adjustment logged.", "Belated shipping charge sync."],
    "SAP Correction Allowed": ["Standard legacy master correction.", "Schema adjustment patch applied.", "Admin database line update."],
    "Approval Bottleneck Bypass": ["Workflow bottleneck bypass logged.", "Managerial override for schedule speed.", "Stale lock routing override."],
    "Phased Budget Release": ["Quarterly budget gating active.", "Phased capital funding release.", "Cyclic allocation breakdown."],
    "Urgent Scope Expansion": ["Project scope expansion order.", "Supplemental asset run logged.", "Immediate scope change adjustment."],
    "Local Approval Routing": ["Plant-level local signoff logged.", "Decentralized authorization bypass.", "Local threshold limit execution."],
    "Urgent Sign-off Bypass": ["Processed ahead of board signoff.", "Schedule emergency bypass clear.", "Pending final leadership log."],
    "Requisition Grouping Fail": ["Consolidation script failed.", "Routines missed batch aggregate.", "Disparate lines split error."],
    "No Aggregate Spend View": ["Facility spend silo error.", "Cross-plant vendor linking missing.", "Localized sheet visibility block."],
    "Vendor Account Maintenance": ["Supplier bank details updated.", "Vendor remittance card change.", "Destination ledger record update."],
    "Subsidiary Routing Request": ["Sister entity routing used.", "Parent company guarantee route.", "Subsidiary clearing token active."],
    "Urgent Checker Bypass": ["Four-eyes review skipped.", "Voucher cleared via speed track.", "Dual-check skipped for deadline."],
    "Verbal Vendor Confirmation": ["Telephone callback logged.", "Offline voice lookup verification.", "Voice authorization audit trace."],
    "Unintegrated Change Log": ["Change log unlinked to run.", "Master edit missed automated alert.", "Registry lookup update gap."],
    "Missing Rapid Change Alert": ["No rapid change alert rule.", "Fraud detection loop absent.", "High-frequency modification lag."],
    "Consolidated Past Returns": ["Returns combined on invoice.", "Distributor items batched together.", "Unified return voucher trace."],
    "Strategic Client Goodwill": ["Goodwill return waiver clear.", "Key account retention variance.", "Policy exception for client tier."],
    "Pending Return GR": ["Pallet under dock review.", "Barcodes pending scan registration.", "Goods returned; system entry lag."],
    "Verbal Sales Auth": ["Verbal field clearance logged.", "Regional manager voice approval.", "Sales desk override trace."],
    "No Batch Validation": ["Traceability mapping absent.", "Lot numbers unverified at entry.", "Returned stock cleared blind."],
    "Unlinked Return Order": ["Return unmapped to invoice.", "Independent return credit logged.", "Standalone balance adjustment run."],
    "Customer Penalty Comp": ["Logistics penalty offset applied.", "Service failure cost credit.", "Buyer penalty deduction mapped."],
    "Market Rate Settlement": ["Aligned to spot commodity index.", "Dynamic index evaluation rule.", "Spot price market tracking applied."],
    "Expedited Refund Entry": ["Priority account refund push.", "Wait window supervisor waiver.", "Immediate credit release override."],
    "Spanning Price Credit": ["Crossed multi-contract epochs.", "Multi-month calculation trace.", "Consolidated adjustments overlap."],
    "No Return Tolerance": ["Return parameters variance alert.", "Zero matching validation caps.", "Unrestricted credit volume open."],
    "Unlocked Source Pricing": ["Source price editable on sheet.", "Price field input protection lag.", "Manual table value rewrite lock."],
    "Staggered Damage Returns": ["Transit damage batches split.", "Incremental carrier lot log.", "Staggered line entry split."],
    "Phased Batch Recall": ["Voluntary product recall step.", "Staggered lot withdrawal rollout.", "Selective recall index match."],
    "Small Batch Returns": ["Distributor rolling stock split.", "Incremental lot tracking logged.", "Rolling return track active."],
    "Customer Space Limits": ["Staged pickup matches space limit.", "Consignment load delayed by buyer.", "Limited layout pickup sequence."],
    "No Invoice Return Limit": ["Infinite mini-returns allowed.", "Repeated item credit lines entry.", "Invoice multi-split reverse loops."],
    "Missing Frequency Report": ["High return alert rule absent.", "Anomalous activities track lag.", "Frequency evaluation script missing."],
    "Wrong Dispatch Reversal": ["Mismatched item SKU return.", "Wrong part delivery correction.", "Rapid selection error reversal."],
    "In-Transit Cancellation": ["Mid-route transit recall run.", "Interception loop active.", "Buyer cancel post dock release."],
    "Quick Billing Correction": ["Typo correction line processed.", "Data entry billing edit window.", "Standard clerk typo rollback."],
    "Rapid Service Policy": ["Quarantine timeline skipped.", "Distributor speed rule active.", "Standard wait states waived clear."],
    "Unrestricted Same-Day Return": ["Same-day processing hold absent.", "Instant audit hold rule missing.", "No time-gated verification check."],
    "No Reversal Alert": ["Audit warning flag inactive.", "High credit trace alert missing.", "Reversal logged without alert pipeline."],
    "Key Distributor Exception": ["Tier-1 distributor time waiver.", "Partner account timeline exception.", "Key channel validation variance."],
    "Partner Liquidity Support": ["Stock buyback program run.", "Network credit line buffer active.", "Channel liquidity balancing push."],
    "Expired Goods Practice": ["Stock rotation return protocol.", "Take-back contract loop run.", "Shelf-life expiry asset reclaim."],
    "Extended Warranty Claim": ["Post-warranty field manager log.", "Extended coverage waiver clear.", "Mechanical exception trace logged."],
    "Missing 180-Day Block": ["Aged account constraint gap.", "Invoice return block rule missing.", "6-month calendar check absent."],
    "Low Value Bypass": ["Inspection skipped: low value.", "Lot test resource bypass log.", "Direct disposal rule triggered."],
    "Cross-Vertical Customer": ["Multi-entity profile duplication.", "Unified buyer profile mapping gap.", "Global database ID index lag."],
    "Legacy System Migration": ["Migration account redundancy.", "Import profile duplication trace.", "Stale database overlap entry."],
    "Urgent Creation Bypass": ["Deduplication check skipped.", "Fast track client setup check.", "Emergency enrollment loop log."],
    "No Data Cleansing": ["Periodic database hygiene lag.", "Stale tracking lines untouched.", "Archive cleanup index missing."],
    "Name Variant Failure": ["String variation missed match.", "Corporate suffix mismatch clear.", "White-space spelling variation gap."],
    "Missing Tax ID Check": ["Tax ID identifier unverified.", "National registry linking gap.", "Tax mapping field left blank."],
    "Competitor Match FOC": ["FOC promo stock drop entry.", "Zero-value item defense line.", "Competitor match channel promo."],
    "Product Launch Samples": ["Demo marketing sample block.", "FOC product lot distribution.", "Trial lot contract setup check."],
    "Expiry Liquidation": ["Near-expiry promo stock drop.", "Distressed item cleanup run.", "Aged inventory discount clear."],
    "Damage Write-Off": ["Transit damage write-off done.", "Broken asset inventory reduction.", "Inspection lot loss log entries."],
    "Missing FOC Workflow": ["Zero-value workflow missing.", "Sample transaction tracking gap.", "Marketing block validation lag."],
    "Offline Management Auth": ["Offline manager signoff doc.", "Manual paperwork tracking log.", "Executive written proxy trace."],
    "Yard Clearance Priority": ["Scrap yard bottleneck clearance.", "Operational safety lane clean.", "Congestion relief scrap batch."],
    "No Time for Quotes": ["Quotes skipped: critical urgency.", "Competitive bid sourcing skipped.", "Single-source space-saver buy."],
    "Off-Spec Downgrade": ["Quality failure scrap drop.", "Failed production lot reclassified.", "Non-compliant batch write-down."],
    "Estimated Weight": ["Weighbridge scale down for fix.", "Weight estimated via packing map.", "Manual load totals logger entry."],
    "Volatile Scrap Rates": ["Market rate mapping deficit.", "Unstable recycling index swing.", "Margin benchmark tracker lag."],
    "Committee Meeting Delay": ["Disposal board meeting lag.", "Committee sign-off log backlogs.", "Write-off authorization delay lookups."],
    "Variable RM Quality": ["RM grade variance yield loss.", "Fluctuating raw material quality.", "Inconsistent grading process logs."],
    "Aging Machine Efficiency": ["Mechanical wear yield loss.", "Degraded tool system metrics.", "Legacy machinery asset loss spikes."],
    "Outdated BOM Yield": ["Stale BOM consumption mix.", "Obsolete recipe profile run.", "BOM yield standard update lag."],
    "Delayed Routing Update": ["Routing sequence delay lookups.", "Operation sequence database lag.", "System process steps stale entry."],
    "Infrequent Variance Review": ["Monitoring interval review gap.", "Leak trace checking frequency lag.", "Monthly variance oversight lapse."],
    "No Yield Analyst on Shift": ["Skilled personnel resource gap.", "Calibration check shifted tracking.", "Expert overnight shift absence."],
    "Strategic Bulk Buy": ["Bulk volume discount buy.", "Pre-ordering bulk cap override.", "Strategic volume lock logging."],
    "Shortage Hedging": ["Material shortage hedge lock.", "Pre-emptive risk insulation buy.", "Anticipated supply bottleneck build."],
    "Stale MRP Signals": ["MRP run frequency discrepancy.", "Obsolete demand planning lines.", "Stale planning signals execution."],
    "Outdated Safety Stock": ["Safety stock threshold lag.", "Excess buffer trigger entries.", "Seasonal consumption map variance."],
    "Unrestricted PO Creation": ["Ceiling limit check absent.", "Excess procurement limit gap.", "Over-procurement rule lock missing."],
    "Missing Overstock Dashboard": ["Overstock visibility dashboard lag.", "Slow inventory review check gap.", "Warehouse profile map block."],
    "Urgent Dispatch Bypass": ["QA signoff skipped for delivery.", "Urgent deadline dispatch override.", "Product analysis report lag trace."],
    "Month-End Revenue Release": ["Month-end dispatch target push.", "QC checking schedule accelerated.", "Laboratory check speed bypass."],
    "QA Lab Down": ["QA diagnostic lab system down.", "Interface transmission link crash.", "Laboratory tool downtime delay."],
    "Night Shift QC Shortage": ["QC inspector staff shortage.", "Reduced shift staff validation lag.", "Late shift queue lookup backlog."],
    "Missing QI Delivery Block": ["QI system block link missing.", "Unreleased stock transit entry.", "Inventory marker relationship gap."],
    "Incorrect Auto-UD": ["Usage decision rule flaw bug.", "Auto-UD script data entry bypass.", "Verification validation step skip."],
    "Salvaged Batch Use": ["Partial failed lot reuse clear.", "Usable segment salvage logging.", "Technical recovery lot conversion."],
    "Conditional Release": ["Provisional operational release.", "Conditional release waiver trace.", "Investigation delay override log."],
    "Missing Physical Tag": ["Quarantine floor labeling label loss.", "Physical tracking label missing.", "Hold marker placement error."],
    "Stock Rotation Failure": ["FIFO sequence floor tracking error.", "Warehouse blockage picked newer.", "Floor sorting inventory swap log."],
    "Unblocked Storage Issue": ["Location block control failure.", "Restricted area control missing.", "Storage logic validation skipped."],
    "No FEFO Enforcement": ["System FEFO sorting logic absent.", "Expiration check step missing.", "Manual date override bypass entry."]
}

def resolve_table_and_column(cursor, config):
    """Find matching table from database"""
    try:
        cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' OR table_schema='oats';")
        db_tables = [r[0].lower().strip() for r in cursor.fetchall()]
        
        # First try exact match from candidates
        for candidate in config["table_candidates"]:
            clean_cand = candidate.lower().strip()
            if clean_cand in db_tables:
                return clean_cand, config["value_candidates"]
        
        # If no exact match, try to find any table that contains the candidate
        for candidate in config["table_candidates"]:
            clean_cand = candidate.lower().strip()
            for t in db_tables:
                if clean_cand in t or t in clean_cand:
                    return t, config["value_candidates"]
        
        # Return None if no match found
        return None, config["value_candidates"]
    except Exception as e:
        print(f"Error resolving table: {e}")
        return None, config["value_candidates"]

def get_matching_column(cursor, table_name, candidates):
    try:
        cursor.execute('SELECT column_name FROM information_schema.columns WHERE table_name = %s;', (table_name,))
        db_cols = [r[0] for r in cursor.fetchall()]
        
        for c in candidates:
            for db_c in db_cols:
                if c.lower().strip() == db_c.lower().strip():
                    return db_c
        
        for c in candidates:
            for db_c in db_cols:
                if c.lower().strip() in db_c.lower().strip() or db_c.lower().strip() in c.lower().strip():
                    return db_c
        
        return None
    except Exception as e:
        print(f"Error getting matching column: {e}")
        return None

def get_db_connection():
    try:
        conn = psycopg2.connect(
            host="ep-fragrant-dawn-at7nzvqv.c-9.us-east-1.aws.neon.tech", 
            port="5432", 
            database="neondb", 
            user="neondb_owner", 
            password="npg_5wQeyoh4pxFT", 
            sslmode="require",
            connect_timeout=10
        )
        return conn
    except Exception as e: 
        print(f"Connection Error: {e}")
        return None

@app.route('/rca/exceptions', methods=['GET'])
def get_exceptions():
    try:
        response_list = []
        for key, value in AUDIT_RISK_MAP.items():
            response_list.append({
                "name": key,
                "category": value["category"],
                "description": value.get("description", "")
            })
        return jsonify(response_list)
    except Exception as e:
        print(f"Error in get_exceptions: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/rca/tree/<path:exception_name>', methods=['GET'])
def get_tree_data(exception_name):
    try:
        if exception_name not in AUDIT_RISK_MAP: 
            return jsonify({"error": f"Exception '{exception_name}' not found"}), 404
        
        target = AUDIT_RISK_MAP[exception_name]
        conn = get_db_connection()
        
        if not conn:
            return generate_mock_tree(exception_name, target)
        
        cursor = conn.cursor()
        try:
            matched_table, val_candidates = resolve_table_and_column(cursor, target)
            
            if not matched_table:
                cursor.close()
                conn.close()
                return generate_mock_tree(exception_name, target)
            
            # Get total count - use double quotes for table name
            query = f'SELECT COUNT(*) FROM "{matched_table}"'
            cursor.execute(query)
            total_records = cursor.fetchone()[0]
            
            if total_records == 0:
                cursor.close()
                conn.close()
                return generate_mock_tree(exception_name, target)
            
            # Get the value column for financial impact
            resolved_value_col = get_matching_column(cursor, matched_table, val_candidates)
            global_sum = float(total_records)
            
            if resolved_value_col:
                try:
                    query = f'SELECT SUM(CAST(NULLIF(TRIM(CAST("{resolved_value_col}" AS TEXT)), \'\') AS NUMERIC)) FROM "{matched_table}"'
                    cursor.execute(query)
                    fetched_val = cursor.fetchone()[0]
                    if fetched_val is not None:
                        global_sum = float(fetched_val)
                except Exception as e:
                    print(f"Error summing column: {e}")
            
            # Distribute records among categories
            children_nodes = []
            fractions = [0.45, 0.35, 0.20]
            sub_fractions = [0.60, 0.40]
            
            for i, cat_def in enumerate(target["cats"]):
                cat_weight = fractions[i % len(fractions)]
                cat_value = global_sum * cat_weight
                cat_count = max(1, math.floor(total_records * cat_weight))
                
                sub_elements = [
                    {"name": cat_def["sub1"], "value": cat_value * sub_fractions[0], "count": max(1, math.floor(cat_count * sub_fractions[0])), "children": []},
                    {"name": cat_def["sub2"], "value": cat_value * sub_fractions[1], "count": max(1, math.floor(cat_count * sub_fractions[1])), "children": []}
                ]
                children_nodes.append({
                    "name": cat_def["name"], 
                    "value": cat_value, 
                    "count": cat_count, 
                    "children": sub_elements
                })
            
            cursor.close()
            conn.close()
            
            return jsonify({
                "name": exception_name, 
                "value": global_sum, 
                "count": total_records, 
                "children": children_nodes,
                "description": target.get("description", ""),
                "table_name": matched_table
            })
            
        except Exception as e:
            print(f"Error in get_tree_data: {traceback.format_exc()}")
            cursor.close()
            conn.close()
            return generate_mock_tree(exception_name, target)
            
    except Exception as e:
        print(f"Error in get_tree_data: {traceback.format_exc()}")
        return generate_mock_tree(exception_name, target)

def generate_mock_tree(exception_name, target):
    """Generate mock tree data when no database data is available"""
    total_records = random.randint(10, 50)
    global_sum = random.randint(50000, 200000)
    
    children_nodes = []
    fractions = [0.45, 0.35, 0.20]
    sub_fractions = [0.60, 0.40]
    
    for i, cat_def in enumerate(target["cats"]):
        cat_weight = fractions[i % len(fractions)]
        cat_value = global_sum * cat_weight
        cat_count = max(1, math.floor(total_records * cat_weight))
        
        sub_elements = [
            {"name": cat_def["sub1"], "value": cat_value * sub_fractions[0], "count": max(1, math.floor(cat_count * sub_fractions[0])), "children": []},
            {"name": cat_def["sub2"], "value": cat_value * sub_fractions[1], "count": max(1, math.floor(cat_count * sub_fractions[1])), "children": []}
        ]
        children_nodes.append({
            "name": cat_def["name"], 
            "value": cat_value, 
            "count": cat_count, 
            "children": sub_elements
        })
    
    return jsonify({
        "name": exception_name, 
        "value": global_sum, 
        "count": total_records, 
        "children": children_nodes,
        "description": target.get("description", ""),
        "table_name": None,
        "is_mock": True
    })

@app.route('/rca/transactions/<path:exception_name>', methods=['GET'])
def get_transactions(exception_name):
    try:
        target = AUDIT_RISK_MAP.get(exception_name)
        if not target:
            return jsonify({"error": f"Exception '{exception_name}' not found"}), 404
        
        conn = get_db_connection()
        if not conn:
            return generate_mock_transactions(exception_name, target)
        
        cursor = conn.cursor()
        try:
            matched_table, _ = resolve_table_and_column(cursor, target)
            
            if not matched_table:
                cursor.close()
                conn.close()
                return generate_mock_transactions(exception_name, target)
            
            # Get all data from the table
            query = f'SELECT * FROM "{matched_table}"'
            
            # Use pandas with SQLAlchemy connection
            try:
                df = pd.read_sql_query(query, conn)
            except Exception as e:
                print(f"Error reading with pandas: {e}")
                # Fallback to manual fetch
                cursor.execute(query)
                columns = [desc[0] for desc in cursor.description]
                rows = cursor.fetchall()
                df = pd.DataFrame(rows, columns=columns)
            
            if len(df) == 0:
                cursor.close()
                conn.close()
                return generate_mock_transactions(exception_name, target)
            
            # Check for comment column
            comment_col = None
            for col in df.columns:
                if col.lower() == 'comment':
                    comment_col = col
                    break
            
            # If comment column exists, fill empty comments with mock comments
            if comment_col:
                parent_filter = request.args.get('parent')
                child_filter = request.args.get('child')
                comment_key = child_filter or parent_filter
                
                if comment_key and comment_key in MOCK_COMMENTS_MAP:
                    mock_variants = MOCK_COMMENTS_MAP[comment_key]
                else:
                    all_comments = []
                    for key in MOCK_COMMENTS_MAP:
                        all_comments.extend(MOCK_COMMENTS_MAP[key])
                    mock_variants = all_comments if all_comments else ["No comment provided."]
                
                for idx in range(len(df)):
                    db_comment = str(df.iloc[idx][comment_col]).strip() if pd.notna(df.iloc[idx][comment_col]) else ""
                    if not db_comment or db_comment == '' or db_comment == 'nan' or db_comment == 'None':
                        mock_comment = mock_variants[idx % len(mock_variants)]
                        df.at[idx, comment_col] = mock_comment
                
                if comment_col != 'Comment':
                    df = df.rename(columns={comment_col: 'Comment'})
            else:
                parent_filter = request.args.get('parent')
                child_filter = request.args.get('child')
                comment_key = child_filter or parent_filter
                
                if comment_key and comment_key in MOCK_COMMENTS_MAP:
                    mock_variants = MOCK_COMMENTS_MAP[comment_key]
                else:
                    all_comments = []
                    for key in MOCK_COMMENTS_MAP:
                        all_comments.extend(MOCK_COMMENTS_MAP[key])
                    mock_variants = all_comments if all_comments else ["No comment provided."]
                
                comments = []
                for idx in range(len(df)):
                    mock_comment = mock_variants[idx % len(mock_variants)]
                    comments.append(mock_comment)
                df['Comment'] = comments
            
            df = df.fillna("")
            
            cursor.close()
            conn.close()
            
            if request.args.get('download') == 'true':
                output = io.StringIO()
                writer = csv.writer(output)
                writer.writerow(df.columns.tolist())
                for _, row in df.iterrows():
                    writer.writerow(row.tolist())
                output.seek(0)
                return Response(
                    output.getvalue(),
                    mimetype="text/csv",
                    headers={"Content-Disposition": f"attachment;filename={exception_name}_transactions.csv"}
                )
            
            return jsonify(df.to_dict(orient='records'))
            
        except Exception as e:
            print(f"Error in get_transactions: {traceback.format_exc()}")
            cursor.close()
            conn.close()
            return generate_mock_transactions(exception_name, target)
            
    except Exception as e:
        print(f"Error in get_transactions: {traceback.format_exc()}")
        return generate_mock_transactions(exception_name, target)

def generate_mock_transactions(exception_name, target):
    """Generate mock transactions when no database data is available"""
    mock_data = []
    categories = target.get("cats", [])
    
    sub_category_pool = []
    for cat in categories:
        sub_category_pool.append({"category": cat["name"], "sub": cat["sub1"]})
        sub_category_pool.append({"category": cat["name"], "sub": cat["sub2"]})
    
    used_combinations = set()
    total_records = random.randint(10, 30)
    
    for i in range(total_records):
        if sub_category_pool:
            available = [item for item in sub_category_pool if f"{item['category']}-{item['sub']}" not in used_combinations]
            if not available:
                used_combinations.clear()
                available = sub_category_pool
            selected = random.choice(available)
            cat_name = selected["category"]
            sub_name = selected["sub"]
            used_combinations.add(f"{cat_name}-{sub_name}")
        else:
            cat_name = "Unknown Category"
            sub_name = "Unknown Sub-Category"
        
        if sub_name in MOCK_COMMENTS_MAP:
            comment = random.choice(MOCK_COMMENTS_MAP[sub_name])
        else:
            comment = random.choice(["Transaction processed successfully.", "System entry checked.", "Compliance trace compliant."])
        
        transaction = {
            "Transaction ID": f"TXN-{random.randint(10000, 99999)}",
            "Document Number": f"DOC-{random.randint(1000, 9999)}",
            "Amount": round(random.uniform(1000, 50000), 2),
            "Date": f"2026-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}",
            "Vendor/Customer": f"Vendor-{random.randint(100, 999)}",
            "Category": cat_name,
            "Sub-Category": sub_name,
            "Status": random.choice(["Open", "Completed", "Pending Review", "Approved"]),
            "Comment": comment
        }
        mock_data.append(transaction)
    
    return jsonify(mock_data)

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5001, debug=True)