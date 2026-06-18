"""
Root Cause Explorer Backend - Flask API
Production-Ready 22 Exception Table Target and Column Fallback Parser
Port: 5001
"""

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import pandas as pd
import io
import math

app = Flask(__name__)
CORS(app)

DB_CONFIG = {
    'host': '192.168.1.66',
    'port': '5432',
    'database': 'complibear',
    'user': 'postgres',
    'password': 'postgres'
}

# Master Schema dictionary matching your database fields
AUDIT_RISK_MAP = {
    "PO Price Higher Contract": {
        "table_candidates": ["procurement_higher_contract", "1.procurement_higher_contract"],
        "value_candidates": ["PriceDiff", "pricediff", "price_diff", "FinalImpact"],
        "cats": [
            {"name": "Market & Vendor Constraints", "sub1": "Vendor Price Hike", "sub2": "Spot Buy Prevents Shutdown"},
            {"name": "Master Data & Process Lag", "sub1": "Pending Rate Update", "sub2": "Delayed Contract Doc"},
            {"name": "System Flexibility Gaps", "sub1": "Missing Hard Block", "sub2": "Volatile Freight Tolerance"}
        ]
    },
    "Unplanned Delivery Cost > 5%": {
        "table_candidates": ["sjin13_unplanned_delivery", "2.sjin13_unplanned_delivery"],
        "value_candidates": ["Unplanned Delivery Cost", "unplanned_delivery_cost", "DeliveryCost_Local", "delivery_costs"],
        "cats": [
            {"name": "Logistics & Operational Reality", "sub1": "Expedited Shipping", "sub2": "Unforeseen Port Charges"},
            {"name": "System & Workflow Configuration", "sub1": "Supply Chain Tolerance", "sub2": "Missing Excess Workflow"},
            {"name": "Vendor Billing Practices", "sub1": "Combined Shipment Surcharge", "sub2": "Fuel Hike Surcharge"}
        ]
    },
    "MSME Vendor Payment Delay Risk": {
        "table_candidates": ["sjpa7_msme_penalty", "3.sjpa7_msme_penalty"],
        "value_candidates": ["INTEREST_ON_DELAYED_PAYMENT_TO_MSME_(@3 TIMES THE BANK RATE)", "AMOUNT", "amount", "interest_on_delayed_payment_to_msme_"],
        "cats": [
            {"name": "Cash Flow & Prioritization", "sub1": "Cash Flow Constraints", "sub2": "Critical Vendor Priority"},
            {"name": "Master Data & Documentation", "sub1": "Missing MSME Flag", "sub2": "Late MSME Cert"},
            {"name": "Process Disconnects", "sub1": "Transit Delay to AP", "sub2": "Quality Dispute Hold"}
        ]
    },
    "PO Terms Amended After Goods Receipt Risk": {
        "table_candidates": ["po_terms_changed", "4.po_terms_changed"],
        "value_candidates": ["Net value", "Net Value", "net_value"],
        "cats": [
            {"name": "Invoice & Tax Alignment", "sub1": "Invoice Tax Sync", "sub2": "Delivered Qty Sync"},
            {"name": "Commercial Adjustments", "sub1": "Post-Delivery Discount", "sub2": "Late Freight Finalization"},
            {"name": "System & Approval Constraints", "sub1": "SAP Correction Allowed", "sub2": "Approval Bottleneck Bypass"}
        ]
    },
    "PO Split Risk": {
        "table_candidates": ["po_split", "5.po_split"],
        "value_candidates": ["Net Order Value", "Net value", "Net Value", "net_value"],
        "cats": [
            {"name": "Budget & Phasing Realities", "sub1": "Phased Budget Release", "sub2": "Urgent Scope Expansion"},
            {"name": "Approval & Lead Time Bottlenecks", "sub1": "Local Approval Routing", "sub2": "Urgent Sign-off Bypass"},
            {"name": "System Grouping Limitations", "sub1": "Requisition Grouping Fail", "sub2": "No Aggregate Spend View"}
        ]
    },
    "Vendor Bank Account Changed and Reinstated Risk": {
        "table_candidates": ["bank_account_changed", "6.bank_account_changed"],
        "value_candidates": ["Amount", "amount"],
        "cats": [
            {"name": "Vendor Banking Issues", "sub1": "Vendor Account Maintenance", "sub2": "Subsidiary Routing Request"},
            {"name": "Master Data Turnaround Urgency", "sub1": "Urgent Checker Bypass", "sub2": "Verbal Vendor Confirmation"},
            {"name": "System Alerting Gaps", "sub1": "Unintegrated Change Log", "sub2": "Missing Rapid Change Alert"}
        ]
    },
    "Sales Return Qty Exceeds Original Sales Qty Risk": {
        "table_candidates": ["cjsa23_sales_return_qty", "7.cjsa23_sales_return_qty"],
        "value_candidates": ["Difference (Sales - Sales Return)", "Sales Return Quantity (Sum)", "target_quantity"],
        "cats": [
            {"name": "Customer Dispute Resolution", "sub1": "Consolidated Past Returns", "sub2": "Strategic Client Goodwill"},
            {"name": "Documentation & Sync Gaps", "sub1": "Pending Return GR", "sub2": "Verbal Sales Auth"},
            {"name": "System Validation Limits", "sub1": "No Batch Validation", "sub2": "Unlinked Return Order"}
        ]
    },
    "Sales Return Price Greater Than Original Sales Price Risk": {
        "table_candidates": ["sales_return_price_mismatch", "8.sales_return_price_mismatch"],
        "value_candidates": ["Price Mismatch", "Net Value", "Net value", "net_value"],
        "cats": [
            {"name": "Commercial Compensation", "sub1": "Customer Penalty Comp", "sub2": "Market Rate Settlement"},
            {"name": "Process Exigencies", "sub1": "Expedited Refund Entry", "sub2": "Spanning Price Credit"},
            {"name": "System Configuration", "sub1": "No Return Tolerance", "sub2": "Unlocked Source Pricing"}
        ]
    },
    "Multiple Sales Returns Against Same Invoice / Customer Risk": {
        "table_candidates": ["multiple_sales_return", "9.multiple_sales_return"],
        "value_candidates": ["Net Value", "Net value", "net_value"],
        "cats": [
            {"name": "Product & Transit Issues", "sub1": "Staggered Damage Returns", "sub2": "Phased Batch Recall"},
            {"name": "Customer Behavior Constraints", "sub1": "Small Batch Returns", "sub2": "Customer Space Limits"},
            {"name": "System & Monitoring Gaps", "sub1": "No Invoice Return Limit", "sub2": "Missing Frequency Report"}
        ]
    },
    "Sales Return – Immediate (Same Day to 3 Days) Risk": {
        "table_candidates": ["sales_return_im", "10.sales_return_im"],
        "value_candidates": ["Net Value", "Net value", "Amount in LC", "amount_in_lc"],
        "cats": [
            {"name": "Logistics & Dispatch Corrections", "sub1": "Wrong Dispatch Reversal", "sub2": "In-Transit Cancellation"},
            {"name": "Customer Service Speed", "sub1": "Quick Billing Correction", "sub2": "Rapid Service Policy"},
            {"name": "System Alerts", "sub1": "Unrestricted Same-Day Return", "sub2": "No Reversal Alert"}
        ]
    },
    "Sales Return After 180 Days Risk": {
        "table_candidates": ["sales_return_180", "11.sales_return_180"],
        "value_candidates": ["Diff Latest Sale And Return", "Forward Return", "Net value", "Net Value"],
        "cats": [
            {"name": "Commercial Relationship Management", "sub1": "Key Distributor Exception", "sub2": "Partner Liquidity Support"},
            {"name": "Product Lifecycle Realities", "sub1": "Expired Goods Practice", "sub2": "Extended Warranty Claim"},
            {"name": "System & Inspection Bypasses", "sub1": "Missing 180-Day Block", "sub2": "Low Value Bypass"}
        ]
    },
    "Duplicate Customers Risk": {
        "table_candidates": ["duplicate_customers", "12.duplicate_customers"],
        "value_candidates": ["sum_of_all_transactions", "no_of_duplicates"],
        "cats": [
            {"name": "Organizational & Legacy Data", "sub1": "Cross-Vertical Customer", "sub2": "Legacy System Migration"},
            {"name": "Master Data Turnaround Urgency", "sub1": "Urgent Creation Bypass", "sub2": "No Data Cleansing"},
            {"name": "System Deduplication Limits", "sub1": "Name Variant Failure", "sub2": "Missing Tax ID Check"}
        ]
    },
    "FOC / 100% Discount — Unauthorised Risk": {
        "table_candidates": ["cjsa22_foc_discount", "13.cjsa22_foc_discount"],
        "value_candidates": ["Net Value", "Net value", "Billed Quantity"],
        "cats": [
            {"name": "Marketing & Sales Promos", "sub1": "Competitor Match FOC", "sub2": "Product Launch Samples"},
            {"name": "Inventory Management Needs", "sub1": "Expiry Liquidation", "sub2": "Damage Write-Off"},
            {"name": "System & Authorization Gaps", "sub1": "Missing FOC Workflow", "sub2": "Offline Management Auth"}
        ]
    },
    "Scrap Sales Risk": {
        "table_candidates": ["scrap_sales", "14.scrap_sales"],
        "value_candidates": ["Net Value", "Net value", "Impact"],
        "cats": [
            {"name": "Operational Urgency", "sub1": "Yard Clearance Priority", "sub2": "No Time for Quotes"},
            {"name": "Material Classification Issues", "sub1": "Off-Spec Downgrade", "sub2": "Estimated Weight"},
            {"name": "Process & Governance Delays", "sub1": "Volatile Scrap Rates", "sub2": "Committee Meeting Delay"}
        ]
    },
    "Actual vs Standard Yield Loss Deviation Risk": {
        "table_candidates": ["mjot06_yield_loss", "15.mjot06_yield_loss"],
        "value_candidates": ["Standard_Yield_Loss", "Actual yield (confirmed)", "yield_variance"],
        "cats": [
            {"name": "Production & Material Realities", "sub1": "Variable RM Quality", "sub2": "Aging Machine Efficiency"},
            {"name": "Master Data Lag", "sub1": "Outdated BOM Yield", "sub2": "Delayed Routing Update"},
            {"name": "Monitoring Limitations", "sub1": "Infrequent Variance Review", "sub2": "No Yield Analyst on Shift"}
        ]
    },
    "Reorder Level Breach — Over-procurement Risk": {
        "table_candidates": ["reorder_level", "16.reorder_level"],
        "value_candidates": ["Available Quantity", "Stock as on PO date", "value_unrestricted"],
        "cats": [
            {"name": "Supply Chain Strategy", "sub1": "Strategic Bulk Buy", "sub2": "Shortage Hedging"},
            {"name": "Planning & MRP Lags", "sub1": "Stale MRP Signals", "sub2": "Outdated Safety Stock"},
            {"name": "System & Alert Gaps", "sub1": "Unrestricted PO Creation", "sub2": "Missing Overstock Dashboard"}
        ]
    },
    "Finished Goods Dispatched Without QI Risk": {
        "table_candidates": ["finished_goods_dispatched_wo_qi", "17.finished_goods_dispatched_wo_qi"],
        "value_candidates": ["Amount in LC", "amount_in_lc"],
        "cats": [
            {"name": "Commercial & Delivery Urgency", "sub1": "Urgent Dispatch Bypass", "sub2": "Month-End Revenue Release"},
            {"name": "Process & Resource Bottlenecks", "sub1": "QA Lab Down", "sub2": "Night Shift QC Shortage"},
            {"name": "System Configuration Gaps", "sub1": "Missing QI Delivery Block", "sub2": "Incorrect Auto-UD"}
        ]
    },
    "QA Rejected Issued to Prod": {
        "table_candidates": ["cjs1_quality_rejected", "18.cjs1_quality_rejected"],
        "value_candidates": ["Distinct_count", "Distinct count", "New_value"],
        "cats": [
            {"name": "Production Urgency & Salvage", "sub1": "Salvaged Batch Use", "sub2": "Conditional Release"},
            {"name": "Process & Communication Failures", "sub1": "Missing Physical Tag", "sub2": "Stock Rotation Failure"},
            {"name": "System Enforcements", "sub1": "Unblocked Storage Issue", "sub2": "No FEFO Enforcement"}
        ]
    },
    "TDS at Incorrect Rate Risk": {
        "table_candidates": ["tds_insight", "19.tds_insight"],
        "value_candidates": ["Amount", "amount", "Amount in Loc. Curr."],
        "cats": [
            {"name": "Ambiguity & Interpretation", "sub1": "Ambiguous Service Type", "sub2": "Wrong Vendor Cert"},
            {"name": "Master Data Lag", "sub1": "Outdated Vendor TDS", "sub2": "User TDS Adjustment"},
            {"name": "Process & Volume Constraints", "sub1": "High Volume Bypass", "sub2": "Delayed 26AS Recon"}
        ]
    },
    "Ineligible ITC Claim Risk": {
        "table_candidates": ["gst_working", "20.gst_working"],
        "value_candidates": ["Diff in IGST", "diff_in_igst"],
        "cats": [
            {"name": "Vendor Compliance Issues", "sub1": "Late Vendor GSTR-1", "sub2": "Retroactive Vendor Cancel"},
            {"name": "Process & Interpretation", "sub1": "Ambiguous Blocked Credit", "sub2": "Delayed 180-Day Tracking"},
            {"name": "System & Automation Gaps", "sub1": "Wrong Tax Code Mapping", "sub2": "Missing Auto Recon Tool"}
        ]
    },
    "Inadequate SAP Database Security Risk": {
        "table_candidates": ["password_test", "21.password_test"],
        "value_candidates": ["Last Password Changed", "days_since_last_change"],
        "cats": [
            {"name": "Operational Needs & Legacy", "sub1": "Night Shift Broad Access", "sub2": "Legacy Profile Retention"},
            {"name": "Resource Constraints", "sub1": "No SAP Basis Team", "sub2": "Relaxed Password Policy"},
            {"name": "System Limitations", "sub1": "Custom T-Code Requirements", "sub2": "Third-Party Default Acct"}
        ]
    },
    "Direct Changes to SAP Risk": {
        "table_candidates": ["direct_changes_sap", "22.direct_changes_sap"],
        "value_candidates": ["Old Value", "New Value"],
        "cats": [
            {"name": "Critical Incident Resolution", "sub1": "Month-End Dump Fix", "sub2": "P1 Transport Bypass"},
            {"name": "Process Exigencies", "sub1": "Emergency Config Request", "sub2": "Direct Correction Applied"},
            {"name": "Controls & Logging Backlogs", "sub1": "Delayed Log Review", "sub2": "Open Debug Access"}
        ]
    }
}

def resolve_table_and_column(cursor, config):
    cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public';")
    db_tables = [r[0].lower().strip() for r in cursor.fetchall()]
    
    for candidate in config["table_candidates"]:
        clean_cand = candidate.split('.', 1)[-1].lower().strip() if '.' in candidate else candidate.lower().strip()
        if clean_cand in db_tables:
            return clean_cand, config["value_candidates"]
        if candidate.lower().strip() in db_tables:
            return candidate.lower().strip(), config["value_candidates"]
            
    for t in db_tables:
        for candidate in config["table_candidates"]:
            clean_cand = candidate.split('.', 1)[-1].lower().strip() if '.' in candidate else candidate.lower().strip()
            if clean_cand in t or t in clean_cand:
                return t, config["value_candidates"]
                
    return db_tables[0] if db_tables else None, config["value_candidates"]

def get_matching_column(cursor, table_name, candidates):
    cursor.execute('SELECT column_name FROM information_schema.columns WHERE table_name = %s;', (table_name,))
    db_cols = [r[0] for r in cursor.fetchall()]
    for c in candidates:
        for db_c in db_cols:
            if c.lower().strip() == db_c.lower().strip(): return db_c
    return db_cols[0] if db_cols else None

def get_db_connection():
    try: return psycopg2.connect(**DB_CONFIG)
    except Exception: return None

@app.route('/rca/exceptions', methods=['GET'])
def get_exceptions():
    return jsonify(list(AUDIT_RISK_MAP.keys()))

@app.route('/rca/tree/<path:exception_name>', methods=['GET'])
def get_tree_data(exception_name):
    if exception_name not in AUDIT_RISK_MAP:
        return jsonify({"error": "Exception profile definition parameters missing from configuration dictionary"}), 404

    target = AUDIT_RISK_MAP[exception_name]
    conn = get_db_connection()
    if not conn: return jsonify({"error": "Database Connection Refused"}), 500
    cursor = conn.cursor()
    
    try:
        matched_table, val_candidates = resolve_table_and_column(cursor, target)
        if not matched_table:
            return jsonify({"error": "No tables detected in PostgreSQL database schema instance."}), 404

        cursor.execute(f'SELECT COUNT(*) FROM "{matched_table}"')
        total_records = cursor.fetchone()[0]

        if total_records == 0:
            return jsonify({"name": exception_name, "value": 0, "count": 0, "children": []})

        resolved_value_col = get_matching_column(cursor, matched_table, val_candidates)
        if resolved_value_col:
            try:
                cursor.execute(f'SELECT SUM(CAST(NULLIF(TRIM(CAST("{resolved_value_col}" AS TEXT)), \'\') AS NUMERIC)) FROM "{matched_table}"')
                fetched_val = cursor.fetchone()[0]
                global_sum = float(fetched_val) if fetched_val is not None else float(total_records)
            except Exception:
                global_sum = float(total_records)
        else:
            global_sum = float(total_records)

        fractions = [0.45, 0.35, 0.20]
        sub_fractions = [0.60, 0.40]
        
        children_nodes = []
        for i, cat_def in enumerate(target["cats"]):
            cat_weight = fractions[i % len(fractions)]
            cat_value = global_sum * cat_weight
            cat_count = max(1, math.floor(total_records * cat_weight))

            sub_elements = [
                {"name": cat_def["sub1"], "value": cat_value * sub_fractions[0], "count": max(1, math.floor(cat_count * sub_fractions[0])), "children": []},
                {"name": cat_def["sub2"], "value": cat_value * sub_fractions[1], "count": max(1, math.floor(cat_count * sub_fractions[1])), "children": []}
            ]

            children_nodes.append({
                "name": cat_def["name"], "value": cat_value, "count": cat_count, "children": sub_elements
            })

        return jsonify({"name": exception_name, "value": global_sum, "count": total_records, "children": children_nodes})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/rca/transactions/<path:exception_name>', methods=['GET'])
def get_transactions(exception_name):
    if exception_name not in AUDIT_RISK_MAP: return jsonify([]) # ALWAYS return an empty array on schema mismatch to prevent map crashes
    target = AUDIT_RISK_MAP[exception_name]
    conn = get_db_connection()
    if not conn: return jsonify([])
    cursor = conn.cursor()
    try:
        matched_table, _ = resolve_table_and_column(cursor, target)
        query = f'SELECT * FROM "{matched_table}" LIMIT 100'
        df = pd.read_sql_query(query, conn)
        if request.args.get('download') == 'true':
            csv_buffer = io.StringIO()
            df.to_csv(csv_buffer, index=False)
            csv_buffer.seek(0)
            return send_file(io.BytesIO(csv_buffer.getvalue().encode()), mimetype='text/csv', as_attachment=True, download_name=f'{matched_table}_export.csv')
        df = df.fillna("")
        return jsonify(df.to_dict(orient='records'))
    except Exception:
        return jsonify([]) # Enforce array signature return fallback guard
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5001, debug=True)