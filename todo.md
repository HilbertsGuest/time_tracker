- ✅ when time less than 1 hour time displayed as minutes
- ✅ pausing the timer
- ✅ move the time tracker section next to the pie chart where currently theres only a circle displayed with the writing weekly view
- ✅ add a 3 dot menu next to the view details of an archived week with option to unarchive (only for current week)
- ✅ make archived weeks deletable via the 3-dot menu
- ✅ remove the functionality that sample data is loaded when the database is empty
- ✅ move the export data and import data to a hamburger menu in the header
- ✅ restructure time tracker layout with task list next to pie chart

## Completed Instructions:

### ✅ Task: Restructure Time Tracker Layout
**Objective:** Make the current time tracker layout editable and reorganize the component structure.

**Implementation:**
- Created two-column layout: Invested time (pie chart + goals) on left, companion widget on right
- Default layout: Task List appears next to the pie chart
- Bottom section: Timer widget (full width)
- User-editable via "Edit Layout" option in hamburger menu (☰)
- Visual edit mode with dashed borders and Move Up/Down buttons
- Layout swapping: Users can swap Task List ↔ Timer positions
- Preference persisted to localStorage
- All existing functionality preserved (timer controls, task CRUD, weekly goal tracking)
- Current styling and color scheme maintained

**How to use:**
1. Click hamburger menu (☰) in header
2. Select "Edit Layout"
3. Use Move Up/Down buttons to swap which widget appears next to the chart
4. Click "Exit Edit Mode" when done
5. Layout preference is automatically saved