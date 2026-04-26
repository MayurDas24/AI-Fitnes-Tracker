// src/utils/exportPDF.js
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const exportWorkoutPlanToPDF = (plan, formData) => {
  const doc = new jsPDF()
  
  // Title
  doc.setFontSize(20)
  doc.setTextColor(220, 38, 38)
  doc.text(plan.name || 'Workout Plan', 20, 20)
  
  // Info
  doc.setFontSize(12)
  doc.setTextColor(100, 100, 100)
  doc.text(`Goal: ${formData.goal === 'muscle_gain' ? 'Muscle Gain' : 'Weight Loss'}`, 20, 35)
  doc.text(`Experience: ${formData.experience}`, 20, 42)
  doc.text(`Days/Week: ${formData.daysPerWeek}`, 20, 49)
  doc.text(`Duration: ${formData.duration} min`, 20, 56)
  
  let yPos = 70
  
  plan.days.forEach((day) => {
    if (day.exercises.length === 0) return
    
    doc.setFontSize(14)
    doc.setTextColor(220, 38, 38)
    doc.text(day.day, 20, yPos)
    yPos += 8
    
    const tableData = day.exercises.map(ex => [
      ex.name,
      ex.sets,
      ex.reps,
      ex.notes || '-'
    ])
    
    autoTable(doc, {
      startY: yPos,
      head: [['Exercise', 'Sets', 'Reps', 'Notes']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [220, 38, 38] },
      styles: { fontSize: 10 }
    })
    
    yPos = doc.lastAutoTable.finalY + 15
  })
  
  doc.save('workout-plan.pdf')
}

export const exportProgressToPDF = (stats, achievements) => {
  const doc = new jsPDF()
  
  doc.setFontSize(20)
  doc.setTextColor(220, 38, 38)
  doc.text('Progress Report', 20, 20)
  
  doc.setFontSize(12)
  doc.setTextColor(100, 100, 100)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 35)
  
  // Stats
  autoTable(doc, {
    startY: 45,
    head: [['Metric', 'Value']],
    body: stats.map(s => [s.label, s.value]),
    theme: 'striped',
    headStyles: { fillColor: [220, 38, 38] }
  })
  
  // Achievements
  const yPos = doc.lastAutoTable.finalY + 15
  doc.setFontSize(14)
  doc.setTextColor(220, 38, 38)
  doc.text('Achievements', 20, yPos)
  
  autoTable(doc, {
    startY: yPos + 5,
    head: [['Achievement', 'Progress', 'Status']],
    body: achievements.map(a => [
      a.title,
      `${a.progress}%`,
      a.unlocked ? 'Unlocked' : 'In Progress'
    ]),
    theme: 'striped',
    headStyles: { fillColor: [220, 38, 38] }
  })
  
  doc.save('progress-report.pdf')
}