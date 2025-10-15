# SetuHub Database Access Guide

## 📊 Database Overview

**Database Name:** `setuhub_marketplace`  
**Connection URL:** `mongodb://localhost:27017`  
**Total Collections:** 8

### Current Data Status:
- **48 Users** (Enterprises, Vendors, Workers)
- **19 Jobs** (13 open, 6 committed)
- **8 Enterprises**
- **9 Facilities (GUs)**
- **6 Vendors**
- **2 Applications**
- **6 Commitments**
- **8 Job Roles**

---

## 🌐 Web-Based Database UI

### Access URL:
**Internal:** http://localhost:8082  
**External:** You can access this through port forwarding or if exposed through your ingress

### Features:
✅ Browse all collections  
✅ Execute custom MongoDB queries  
✅ View results in Table or JSON format  
✅ Export collections to JSON  
✅ Filter, sort, and limit results  
✅ View document counts in real-time  

### How to Use:

1. **Select a Collection** - Click on any collection card or use the dropdown
2. **Write Query** - Use MongoDB JSON syntax:
   ```json
   {}                              // Get all documents
   {"status": "open"}              // Filter by field
   {"user_type": "vendor"}         // Find vendors
   {"$or": [{"role": "rider"}, {"role": "loader"}]}  // OR condition
   ```
3. **Set Limit** - Default is 50 documents
4. **Add Sort** - Optional, e.g., `{"created_at": -1}` for newest first
5. **Execute Query** - Click "Execute Query" button
6. **Switch Views** - Toggle between Table and JSON view
7. **Export** - Download entire collection as JSON

---

## 💾 Database Dump

### Location:
`/app/setuhub_database_dump.tar.gz` (11KB compressed)

### Contains:
- `users.json` (20KB) - All user accounts
- `jobs.json` (9.8KB) - All job postings
- `enterprises.json` (2.2KB) - Enterprise data
- `gus.json` (3.3KB) - Facility locations
- `vendors.json` (2.6KB) - Vendor profiles
- `applications.json` (974B) - Job applications
- `commitments.json` (2.0KB) - Vendor commitments
- `job_roles.json` (4.3KB) - Job role templates

### Extract:
```bash
cd /app
tar -xzf setuhub_database_dump.tar.gz
```

### Import back to MongoDB:
```bash
mongoimport --db=setuhub_marketplace --collection=users --file=users.json --jsonArray
```

---

## 🔧 Command Line Access

### Connect via mongosh:
```bash
mongosh mongodb://localhost:27017/setuhub_marketplace
```

### Common Queries:

#### View Collections
```javascript
show collections
```

#### Count Documents
```javascript
db.users.countDocuments()
db.jobs.countDocuments({status: "open"})
```

#### Find Documents
```javascript
// Get all enterprises
db.enterprises.find()

// Find open jobs
db.jobs.find({status: "open"})

// Find specific user
db.users.findOne({email: "test@example.com"})

// Find with projection (select fields)
db.users.find({user_type: "vendor"}, {email: 1, full_name: 1})
```

#### Aggregate Data
```javascript
// Count jobs by status
db.jobs.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
])

// Count users by type
db.users.aggregate([
  { $group: { _id: "$user_type", count: { $sum: 1 } } }
])
```

#### Update Documents
```javascript
// Update single document
db.jobs.updateOne(
  {id: "job-uuid-here"},
  {$set: {status: "fulfilled"}}
)

// Update multiple
db.jobs.updateMany(
  {status: "open"},
  {$set: {featured: true}}
)
```

#### Delete Documents
```javascript
// Delete single
db.jobs.deleteOne({id: "job-uuid-here"})

// Delete multiple
db.jobs.deleteMany({status: "cancelled"})
```

---

## 📋 Collection Schemas

### users
```json
{
  "id": "uuid",
  "username": "email or phone",
  "email": "user@example.com",
  "password": "hashed",
  "user_type": "enterprise | vendor | job_seeker",
  "full_name": "John Doe",
  "phone": "9876543210",
  "enterprise_id": "uuid or null",
  "vendor_id": "uuid or null",
  "created_at": "ISO date"
}
```

### jobs
```json
{
  "id": "uuid",
  "enterprise_id": "uuid",
  "gu_id": "uuid",
  "role": "picker | rider | loader | etc",
  "quantity_required": 10,
  "shift_time": "morning | evening | full_day",
  "description": "text",
  "salary": "25000",
  "experience_required": "1-2 years",
  "status": "open | vendor_committed | fulfilled | cancelled",
  "created_by": "user_id",
  "created_at": "ISO date",
  "committed_vendor_id": "uuid or null"
}
```

### enterprises
```json
{
  "id": "uuid",
  "name": "Company Name",
  "enterprise_type": "qcom | ecomm | 3pl",
  "tier": 1,
  "gst_no": "GST123456",
  "description": "text",
  "created_at": "ISO date"
}
```

### vendors
```json
{
  "id": "uuid",
  "name": "Vendor Name",
  "gst_no": "GST123456",
  "email": "vendor@example.com",
  "phone": "9876543210",
  "operating_states": ["Karnataka", "Maharashtra"],
  "operating_cities": ["Bangalore", "Mumbai"],
  "operating_pin_codes": ["560001", "400001"],
  "services_offered": ["picker", "loader", "rider"],
  "created_at": "ISO date"
}
```

---

## 🔍 Sample Queries for Analysis

### 1. Jobs by Status
```javascript
db.jobs.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 }, total_positions: { $sum: "$quantity_required" } } }
])
```

### 2. Top Enterprises by Job Postings
```javascript
db.jobs.aggregate([
  { $group: { _id: "$enterprise_id", job_count: { $sum: 1 } } },
  { $sort: { job_count: -1 } },
  { $limit: 5 }
])
```

### 3. Jobs by Role
```javascript
db.jobs.aggregate([
  { $group: { _id: "$role", count: { $sum: 1 }, positions: { $sum: "$quantity_required" } } },
  { $sort: { count: -1 } }
])
```

### 4. Vendors by Operating Cities
```javascript
db.vendors.aggregate([
  { $unwind: "$operating_cities" },
  { $group: { _id: "$operating_cities", vendor_count: { $sum: 1 } } },
  { $sort: { vendor_count: -1 } }
])
```

### 5. Application Rate
```javascript
db.applications.countDocuments() / db.jobs.countDocuments({status: "open"})
```

---

## 🚀 Quick Commands

### Export Collection
```bash
mongoexport --db=setuhub_marketplace --collection=users --out=users.json --jsonArray
```

### Import Collection
```bash
mongoimport --db=setuhub_marketplace --collection=users --file=users.json --jsonArray
```

### Backup Entire Database
```bash
mongodump --db=setuhub_marketplace --out=/tmp/backup
```

### Restore Database
```bash
mongorestore --db=setuhub_marketplace /tmp/backup/setuhub_marketplace
```

---

## 📞 Support

For any database-related queries or issues, refer to:
- MongoDB Documentation: https://docs.mongodb.com/
- Query Syntax: https://docs.mongodb.com/manual/reference/operator/query/

---

**Last Updated:** October 15, 2025  
**Database Version:** MongoDB 6.0+  
**Total Documents:** 105+
