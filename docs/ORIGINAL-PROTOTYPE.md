# Book of the Dead in 3D

An interactive web platform for exploring photogrammetric 3D models and
spatially anchored research annotations.

I built this prototype as part of my work with UC Berkeley's Book of the
Dead in 3D project. The goal is to explore how 3D cultural heritage objects
can be connected to structured scholarly data including annotations,
translations, transliterations, and object metadata.

## What it does

- Renders photogrammetric GLB models directly in the browser
- Supports interactive rotation and exploration of 3D objects
- Uses raycasting to identify coordinates on model geometry
- Anchors research annotations to 3D positions
- Stores annotation content and coordinates in PostgreSQL through Supabase
- Fetches annotation data server-side with Next.js
- Displays annotation details through an interactive research interface
- Provides a geographic interface for navigating objects by location

## Architecture

The application separates the 3D interface from the research data.

Annotation records are stored in Supabase/PostgreSQL with their associated
x, y, and z coordinates. Next.js retrieves those records server-side and
passes them into the interactive React interface. React Three Fiber renders
the GLB model and maps the database records to markers positioned within the
Three.js scene.

Photogrammetry → GLB → Next.js → React Three Fiber / Three.js

PostgreSQL / Supabase → Next.js Server Components → React → 3D annotations

## Tech Stack

**Frontend**
- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Motion

**3D**
- Three.js
- React Three Fiber
- Drei
- GLTF / GLB

**Backend & Data**
- Supabase
- PostgreSQL
- Row Level Security

**Deployment**
- Vercel
- Git / GitHub

## How the 3D annotations work

The GLB model is loaded into a Three.js scene using Drei's `useGLTF`.
React Three Fiber provides the rendering layer between React and Three.js.

Clicks on the model use raycasting to determine the intersection point on
the 3D geometry. The resulting `(x, y, z)` coordinates can then be associated
with an annotation record.

At runtime, annotation records are retrieved from PostgreSQL and rendered at
their stored coordinates in the 3D scene. Selecting a marker opens the
corresponding research content in the interface.

## Status

This repository is an active prototype exploring the technical architecture
for connecting photogrammetric models with structured research data.

Current work focuses on the 3D annotation interface, geographic object
navigation, and integration between the web application and the
photogrammetry workflow.

## Running locally

Clone the repository and install dependencies:

```bash
npm install
npm run dev
