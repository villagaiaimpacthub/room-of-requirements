# ImgxAI - Product Requirements Document

## 1. Introduction

This document outlines the comprehensive product requirements for ImgxAI, a web application that enables users to generate images through OpenAI's image generation API. The PRD serves as a reference for the development team, providing detailed specifications for features, user interface, technical requirements, and design guidelines to ensure consistent implementation of the product vision.

## 2. Product overview

ImgxAI is a user-friendly web application that allows users to create AI-generated images by submitting text prompts to OpenAI's image generation API. The application provides a simple, intuitive interface where users can enter prompts, customize generation parameters, view their generation history in a timeline format, and download the resulting images. ImgxAI emphasizes ease of use, performance, and accessibility while maintaining a minimalist design aesthetic.

## 3. Goals and objectives

### 3.1 Primary goals
- Create a streamlined interface for generating images using OpenAI's `gpt-image-1` model
- Provide users with a persistent timeline of their image generation history
- Enable customization of image parameters while maintaining simplicity
- Ensure responsive performance across all device types
- Deliver a minimalist, accessible user experience

## 4. Target audience

### 4.1 Primary users
- Creative professionals seeking inspiration or assets
- Designers exploring visual concepts
- Content creators needing custom imagery
- Hobbyists experimenting with AI image generation
- Anyone with an OpenAI API key interested in creating images

### 4.2 User needs
- Simple, intuitive interface for prompt submission
- Quick access to previously generated images
- Ability to customize image parameters
- Offline access to previous generations
- Easy downloading of generated images

## 5. Features and requirements

### 5.1 Core integration

| Requirement ID | Requirement | Description | Priority |
|----------------|-------------|-------------|----------|
| CI-101 | Image model integration | Implement integration with OpenAI `gpt-image-1` model | High |
| CI-102 | API call implementation | Configure the application to make calls to OpenAI Images API | High |
| CI-103 | Default moderation | Ensure all prompt submissions include `moderation="low"` parameter | High |

### 5.2 User interface

| Requirement ID | Requirement | Description | Priority |
|----------------|-------------|-------------|----------|
| UI-101 | Unified layout | Implement single-page interface with fixed bottom chat input and scrollable timeline grid | High |
| UI-102 | Responsive timeline grid | Create responsive grid layout: 1 column (mobile), 2 columns (tablet), 4 columns (desktop) | High |
| UI-103 | Infinite scroll | Implement pagination with automatic loading of older results when approaching bottom of scroll | Medium |
| UI-104 | Timeline filters | Add filters for date range, status, aspect ratio, and sort order (newest/oldest) with minimal UI | Medium |
| UI-105 | Image tile display | Show images in original aspect ratio within square thumbnails, with click action to open details view | High |
| UI-106 | Details view | Create modal showing full prompt, all related images, metadata, re-run button, and download options | High |
| UI-107 | Navigation | Implement top bar with app title and settings button | Medium |

### 5.3 Prompt lifecycle

| Requirement ID | Requirement | Description | Priority |
|----------------|-------------|-------------|----------|
| PL-101 | Prompt submission | Allow users to enter text prompts with optional parameters | High |
| PL-102 | Job processing | Process submissions as background jobs with immediate placeholder display | High |
| PL-103 | Result display | Update placeholder with actual images upon job completion | High |
| PL-104 | Re-run capability | Enable users to re-run any previous prompt as a new job | Medium |

### 5.4 Prompt options

| Requirement ID | Requirement | Description | Priority |
|----------------|-------------|-------------|----------|
| PO-101 | Quality selection | Allow selection between "low", "mid", and "high" quality | High |
| PO-102 | Aspect ratio selection | Provide options for "1024x1024", "1536x1024", and "1024x1536" aspect ratios | High |
| PO-103 | Output compression | Enable compression setting between 0-100 with default of 50 | Medium |
| PO-104 | Fixed parameters | Set fixed values for output_format ("webp"), moderation ("low"), response_format ("b64_json"), and model ("gpt-image-1") | High |
| PO-105 | Image count | Allow user to specify number of images to generate (n ≥ 1) | Medium |

### 5.5 Storage

| Requirement ID | Requirement | Description | Priority |
|----------------|-------------|-------------|----------|
| ST-101 | API key storage | Securely store OpenAI API key in browser local storage | High |
| ST-102 | Image storage | Store generated images as Base-64 strings with prompt metadata | High |
| ST-103 | IndexedDB implementation | Use IndexedDB via wrapper for persistent storage, keyed by jobId | High |
| ST-104 | Offline access | Enable access to previously generated images when offline | Medium |

### 5.6 Downloading

| Requirement ID | Requirement | Description | Priority |
|----------------|-------------|-------------|----------|
| DL-101 | Client-side download | Implement client-side download functionality for WebP images | High |
| DL-102 | Compression respect | Apply the specified output_compression setting to downloaded images | Medium |

## 6. User stories and acceptance criteria

### 6.1 User setup and configuration

**ST-101: First-time setup**
- As a new user, I want to set up my API key so I can start generating images
- **Acceptance Criteria:**
  - Settings modal includes field for OpenAI API key entry
  - API key is securely stored in browser storage
  - Validation confirms API key is in correct format
  - User receives confirmation when key is saved successfully

**ST-102: Updating settings**
- As a user, I want to update my API key and preferences when needed
- **Acceptance Criteria:**
  - Settings modal is accessible from the top navigation bar
  - Previously saved API key is displayed (masked) for review
  - Changes are saved only when explicitly submitted
  - User receives confirmation when settings are updated

### 6.2 Image generation

**IG-101: Basic prompt submission**
- As a user, I want to enter a text prompt to generate an image
- **Acceptance Criteria:**
  - Input field is prominently displayed at bottom of screen
  - Submit button or enter key triggers generation
  - Visual indication shows generation is in progress
  - Generated images appear in the timeline upon completion

**IG-102: Advanced parameter configuration**
- As a user, I want to customize image generation parameters
- **Acceptance Criteria:**
  - Options for quality, aspect ratio, compression, and count are available
  - UI clearly indicates current selection and default values
  - Parameter changes persist during the current session
  - Selected parameters are correctly sent with API requests

**IG-103: Error handling**
- As a user, I want to know when an error occurs during generation
- **Acceptance Criteria:**
  - Error messages are clearly displayed when API calls fail
  - Different error types (authentication, content policy, server error) show appropriate messages
  - Options to retry failed jobs are provided
  - Helpful troubleshooting suggestions are included with errors

### 6.3 Timeline and history

**TL-101: Viewing generation history**
- As a user, I want to see all my previously generated images in a timeline
- **Acceptance Criteria:**
  - Timeline displays all past generations in a grid layout
  - Grid is responsive according to device size specifications
  - Images load efficiently with lazy loading implementation
  - Timeline maintains position when returning from detail view

**TL-102: Filtering and sorting**
- As a user, I want to filter and sort my image history
- **Acceptance Criteria:**
  - Filter options for date range, status, and aspect ratio are provided
  - Sort controls allow toggling between newest and oldest first
  - Filtered view updates immediately when selections change
  - Current filter/sort state is visually indicated

**TL-103: Infinite scrolling**
- As a user, I want to seamlessly browse my entire generation history
- **Acceptance Criteria:**
  - Additional history items load automatically when scrolling near bottom
  - Loading indicator appears during pagination fetches
  - Scroll position is maintained when new items load
  - Performance remains smooth even with large history

### 6.4 Image interaction

**II-101: Viewing image details**
- As a user, I want to view detailed information about a generated image
- **Acceptance Criteria:**
  - Clicking an image opens a detail view
  - Detail view shows full prompt text, all related images, and metadata
  - Information includes jobId, creation time, status, dimensions, and other parameters
  - Navigation controls allow browsing between images from the same prompt

**II-102: Downloading images**
- As a user, I want to download generated images to my device
- **Acceptance Criteria:**
  - Download button is available for each image in detail view
  - Downloaded images maintain proper quality based on compression setting
  - Files download in WebP format with appropriate naming
  - Download works on all supported devices and browsers

**II-103: Re-running prompts**
- As a user, I want to re-run previous prompts to get new variations
- **Acceptance Criteria:**
  - Re-run button is available in the detail view
  - Re-running uses the exact same parameters as the original generation
  - New job appears as a separate entry in the timeline
  - Visual indication distinguishes between original and re-run jobs

### 6.5 Edge cases

**EC-101: Offline usage**
- As a user, I want to access my previously generated images when offline
- **Acceptance Criteria:**
  - Previously generated images are viewable when offline
  - Clear indication shows that new generations aren't possible offline
  - Application gracefully handles transition between online and offline states
  - Queued actions are processed when connection is restored

**EC-102: Storage limitations**
- As a user, I want to manage my storage when it gets full
- **Acceptance Criteria:**
  - Warning appears when storage approaches browser limits
  - Option to clear old images is available in settings
  - Selective deletion of images is possible
  - Storage usage indicator is visible in settings

## 7. Technical requirements

### 7.1 Technology stack

| Requirement ID | Requirement | Description |
|----------------|-------------|-------------|
| TS-101 | Language | Implement using TypeScript for type safety and better developer experience |
| TS-102 | Framework | Use Next.js 15 with App Router and React Server Components where appropriate |
| TS-103 | Styling | Implement styling with TailwindCSS and Shadcn UI components; use Lucide icons for actions |
| TS-104 | Forms | Implement forms with React Hook Form and Zod validation |
| TS-105 | State management | Use React Query or SWR for API calls and caching; implement Context/Store for global settings |

### 7.2 API integration

| Requirement ID | Requirement | Description |
|----------------|-------------|-------------|
| API-101 | OpenAI client | Implement secure client for OpenAI's Images API |
| API-102 | Parameter mapping | Correctly map UI parameters to API request parameters |
| API-103 | Error handling | Implement comprehensive error handling for API responses |
| API-104 | Rate limiting | Add support for managing API rate limits, including user feedback |

### 7.3 Storage implementation

| Requirement ID | Requirement | Description |
|----------------|-------------|-------------|
| SI-101 | IndexedDB wrapper | Implement thin wrapper around IndexedDB for easier data access |
| SI-102 | Data schema | Define schema for storing jobs, images, and metadata |
| SI-103 | Query optimization | Optimize queries for timeline display and filtering |
| SI-104 | Data migration | Support schema migrations for future updates |

### 7.4 Performance requirements

| Requirement ID | Requirement | Description |
|----------------|-------------|-------------|
| PR-101 | Image optimization | Implement lazy loading and appropriate compression for timeline images |
| PR-102 | Response time | Page load time should be under 2 seconds |
| PR-103 | Memory management | Efficient memory usage for large image collections |

## 8. Design and user interface

### 8.1 Visual design principles

- Minimalist interface focusing on content rather than chrome
- Consistent spacing and sizing throughout the application
- Clean typography with clear hierarchy
- Support for both light and dark modes via TailwindCSS
- High contrast ratio for accessibility
- Visual feedback for all user interactions

### 8.2 User interface components

#### 8.2.1 Main layout
- Single-page application with fixed navigation bar at top
- Chat-style input fixed at bottom of screen
- Scrollable timeline grid occupying main content area
- Modal overlays for details view and settings

#### 8.2.2 Timeline grid
- Responsive grid layout based on device size
- Each cell displays image thumbnail with minimal metadata
- Visual indication of job status (pending, completed, failed)
- Consistent padding and spacing between items

#### 8.2.3 Input area
- Prominent text input for prompt entry
- Expandable panel for additional parameters
- Submit button with appropriate loading states
- Error feedback displayed inline

#### 8.2.4 Details view
- Full-screen modal with close button
- Large image display with navigation between related images
- Complete metadata panel
- Action buttons for download and re-run

### 8.3 Accessibility requirements

- WCAG 2.1 AA compliance for all interface elements
- Keyboard navigation throughout the application
- Screen reader compatibility for all functionality
- Appropriate alt text derived from prompts
- Focus indicators for keyboard navigation

### 8.4 Responsive design specifications

| Breakpoint | Grid columns | UI adjustments |
|------------|--------------|----------------|
| Small (< sm) | 1 column | Simplified options UI, vertical layout |
| Medium (sm - lg) | 2 columns | Compact metadata display, horizontal options |
| Large (> lg) | 4 columns | Full feature display, expanded details view |

### 8.5 Error states and feedback

- Clear error banners for API and authentication issues
- Inline validation for form inputs
- Loading indicators for in-progress actions
- Success confirmations for completed operations
- Helpful guidance for resolving common issues 