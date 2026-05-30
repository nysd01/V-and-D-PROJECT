# InternConnect — UML Diagrams
Paste each diagram block into https://plantuml.com/plantuml to generate PNG images for your report.

---

## Diagram 1 — Use Case Diagram

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle
skinparam actorStyle awesome

actor "Intern" as I
actor "Firm" as F
actor "Google OAuth" as G

rectangle InternConnect {
  usecase "Register Account" as UC1
  usecase "Login" as UC2
  usecase "Sign in with Google" as UC3
  usecase "Reset Password" as UC4
  usecase "Browse Internships" as UC5
  usecase "Search & Filter" as UC6
  usecase "Save Internship" as UC7
  usecase "Apply for Internship" as UC8
  usecase "Upload CV / Document" as UC9
  usecase "Track Applications" as UC10
  usecase "View Notifications" as UC11
  usecase "Edit Profile" as UC12
  usecase "Upload Profile Picture" as UC13

  usecase "Post Internship" as UC14
  usecase "Manage Postings" as UC15
  usecase "View Applicants" as UC16
  usecase "Review Application Detail" as UC17
  usecase "Update Application Status" as UC18
  usecase "Schedule Interview" as UC19
  usecase "Download Applicant CV" as UC20
  usecase "Edit Firm Profile" as UC21
}

I --> UC1
I --> UC2
I --> UC3
I --> UC4
I --> UC5
I --> UC6
I --> UC7
I --> UC8
I --> UC9
I --> UC10
I --> UC11
I --> UC12
I --> UC13

F --> UC1
F --> UC2
F --> UC3
F --> UC14
F --> UC15
F --> UC16
F --> UC17
F --> UC18
F --> UC19
F --> UC20
F --> UC21

UC3 ..> G : <<uses>>
UC6 ..> UC5 : <<extends>>
UC9 ..> UC8 : <<includes>>
@enduml
```

---

## Diagram 2 — Sequence Diagram: User Login

```plantuml
@startuml
skinparam sequenceMessageAlign center
actor "User" as U
participant "Login Screen" as LS
participant "AuthContext" as AC
participant "API Service" as API
participant "Express Backend" as BE
participant "Supabase DB" as DB
participant "AsyncStorage" as AS

U -> LS : Enter email + password
U -> LS : Tap "Login"
LS -> AC : login(email, password)
AC -> API : POST /api/auth/login
API -> BE : HTTP Request
BE -> DB : SELECT * FROM users WHERE email=?
DB --> BE : user row
BE -> BE : bcrypt.compare(password, hash)
BE -> BE : jwt.sign({ id, type })
BE --> API : { token, user }
API --> AC : { token, user }
AC -> AS : AsyncStorage.setItem('auth_token', token)
AC -> AC : setUser(user)
AC --> LS : User object
LS -> LS : router.replace(dashboard)
@enduml
```

---

## Diagram 3 — Sequence Diagram: Apply for Internship

```plantuml
@startuml
actor "Intern" as I
participant "Apply Screen" as AS
participant "API Service" as API
participant "Express Backend" as BE
participant "Supabase Storage" as SS
participant "Supabase DB" as DB

I -> AS : Pick CV file
AS -> AS : FileSystem.readAsStringAsync(uri, base64)
AS -> API : POST /api/upload/document\n{ base64, mimeType }
API -> BE : HTTP Request + JWT
BE -> BE : Verify JWT token
BE -> SS : Upload buffer to documents/
SS --> BE : Public URL
BE -> DB : (no DB write — URL returned)
BE --> API : { url }
API --> AS : document URL

I -> AS : Write cover letter
I -> AS : Tap "Submit Application"
AS -> API : POST /api/applications\n{ internship_id, cover_letter, document_url }
API -> BE : HTTP Request + JWT
BE -> BE : Verify JWT (intern only)
BE -> DB : INSERT INTO applications
DB --> BE : application row
BE --> API : { id, status: "Pending" }
API --> AS : success

AS -> API : POST /api/notifications\n(create confirmation)
AS -> AS : Show "Application Sent!" alert
@enduml
```

---

## Diagram 4 — Sequence Diagram: Firm Reviews Applicant

```plantuml
@startuml
actor "Firm" as F
participant "Firm Applicants Screen" as FAS
participant "API Service" as API
participant "Express Backend" as BE
participant "Supabase DB" as DB
participant "WebBrowser" as WB

F -> FAS : Navigate to posting applicants
FAS -> API : GET /api/applications/posting/:id
API -> BE : HTTP Request + JWT
BE -> BE : Verify JWT (firm only)
BE -> DB : SELECT applications JOIN users\nWHERE internship_id=? AND firm_id=?
DB --> BE : applicants[]
BE --> API : applicants with document_url
API --> FAS : Render applicant cards

F -> FAS : Tap applicant card
FAS -> FAS : Show ApplicantDetailModal

F -> FAS : Tap "Schedule Interview"
FAS -> FAS : Show InterviewModal
F -> FAS : Enter date + time
FAS -> API : PATCH /api/applications/:id/status\n{ status: "Interviewing", interview_scheduled_at }
API -> BE : HTTP Request + JWT
BE -> DB : UPDATE applications SET status, interview_scheduled_at
DB --> BE : updated row
BE --> API : success
FAS -> FAS : Update card badge

F -> FAS : Tap "View CV"
FAS -> WB : WebBrowser.openBrowserAsync(document_url)
WB -> WB : Open Supabase Storage URL in Chrome
@enduml
```

---

## Diagram 5 — Class Diagram (Data Model)

```plantuml
@startuml
skinparam classAttributeIconSize 0

class User {
  +id: bigint
  +email: string
  +password_hash: string
  +name: string
  +type: "intern" | "firm"
  +profile_picture: string?
  +university: string?
  +company_name: string?
  +industry: string?
  +address: string?
  +reset_token: string?
  +reset_token_expires: timestamp?
  +created_at: timestamp
}

class Internship {
  +id: bigint
  +firm_id: bigint
  +title: string
  +category: string
  +description: string
  +requirements: string?
  +location: string
  +work_type: "Remote"|"Hybrid"|"In-person"
  +is_paid: boolean
  +status: "active" | "closed"
  +posted_on: timestamp
  +created_at: timestamp
}

class Application {
  +id: bigint
  +intern_id: bigint
  +internship_id: bigint
  +cover_letter: string?
  +document_url: string?
  +interview_scheduled_at: timestamp?
  +status: "Pending"|"Interviewing"|"Accepted"|"Rejected"
  +applied_at: timestamp
}

class SavedInternship {
  +id: bigint
  +intern_id: bigint
  +internship_id: bigint
  +saved_at: timestamp
}

User "1" --> "0..*" Internship : posts (as firm)
User "1" --> "0..*" Application : submits (as intern)
Internship "1" --> "0..*" Application : receives
User "1" --> "0..*" SavedInternship : saves
Internship "1" --> "0..*" SavedInternship : saved in
@enduml
```

---

## Diagram 6 — Component Diagram

```plantuml
@startuml
skinparam componentStyle rectangle

package "Mobile/Web Client" {
  [Auth Screens] as AUTH
  [Intern Screens] as INTERN
  [Firm Screens] as FIRM
  [API Service Layer] as APISVC
  [AuthContext] as ACTX
  [AsyncStorage] as ASTOR
}

package "Backend Server (Docker)" {
  [Auth Routes] as AR
  [Internship Routes] as IR
  [Application Routes] as APR
  [Upload Routes] as UR
  [Notification Routes] as NR
  [Saved Routes] as SR
  [JWT Middleware] as JWT
}

package "Supabase Cloud" {
  database "PostgreSQL" as PG
  storage "Object Storage" as OS
}

AUTH --> ACTX
INTERN --> APISVC
FIRM --> APISVC
ACTX --> APISVC
ACTX --> ASTOR

APISVC --> AR : POST /auth/*
APISVC --> IR : GET/POST/PATCH/DELETE /internships
APISVC --> APR : GET/POST/PATCH/DELETE /applications
APISVC --> UR : POST /upload/*
APISVC --> NR : GET /notifications
APISVC --> SR : GET/POST/DELETE /saved

AR --> JWT
IR --> JWT
APR --> JWT
UR --> JWT
NR --> JWT
SR --> JWT

AR --> PG
IR --> PG
APR --> PG
NR --> PG
SR --> PG
UR --> OS
UR --> PG
@enduml
```

---

## Diagram 7 — Deployment Diagram

```plantuml
@startuml
skinparam nodeStyle rectangle

node "User Device" {
  [Android App\n(Expo Go)] as AND
  [iOS App\n(Expo Go)] as IOS
  [Web Browser\n(Chrome/Edge)] as WEB
}

node "Host Machine / VPS" {
  node "Docker Engine" {
    node "internconnect-frontend\n(nginx:alpine)" {
      [Expo Web Build\n(Static HTML/JS)] as SPA
      [nginx Reverse Proxy] as NGX
    }
    node "internconnect-backend\n(node:22-alpine)" {
      [Express REST API\nPort 3000] as API
    }
    [Docker Bridge Network] as NET
  }
}

cloud "Supabase Cloud" {
  database "PostgreSQL\nDatabase" as PG
  storage "Object Storage\n(internconnect bucket)" as OS
}

AND --> API : HTTP:3000
IOS --> API : HTTP:3000
WEB --> NGX : HTTP:80
NGX --> API : proxy /api → backend:3000
API --> NET
NGX --> NET
API --> PG : Supabase REST
API --> OS : Supabase Storage
@enduml
```

---

## How to use these diagrams

1. Go to **https://www.plantuml.com/plantuml/uml/**
2. Paste each `@startuml ... @enduml` block
3. Click Submit → Download PNG
4. Insert PNG into your Word report

**OR** use VS Code extension: `PlantUML` by jebbs — preview and export directly.

**OR** use draw.io (diagrams.net) → Extras → Edit Diagram → paste the PlantUML code.
