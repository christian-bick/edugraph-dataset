### Time Visual Checklist

- The problem displays an analog clock with hour and minute hands (and a thin second hand if the interval is less than 60 seconds).
- The tick marks around the clock face must be clearly rendered: larger circles or ticks for 5-minute/hour marks, smaller circles/ticks for 1-minute marks.
- For Normal clock mode (isReverse is false):
  - The digital time box is empty/dashed in question mode.
  - In solution mode, the correct digital time is shown inside the box in green color (e.g. "04:00" or "04:30" or "04:30:15").
- For Reverse clock mode (isReverse is true):
  - The digital time is shown inside the box in question mode.
  - The clock hands are missing in question mode.
  - In solution mode, the clock hands are drawn in the correct position corresponding to the digital time and styled in green.
