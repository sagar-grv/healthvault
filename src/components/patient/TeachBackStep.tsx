'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';

interface TeachBackStepProps {
  question: string;
  options: string[];
  correctAnswer: string;
  onComplete: (correct: boolean) => void;
}

export default function TeachBackStep({
  question,
  options,
  correctAnswer,
  onComplete,
}: TeachBackStepProps) {
  const [selected, setSelected] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const isCorrect = selected === correctAnswer;

  const handleSubmit = () => {
    setSubmitted(true);
    onComplete(isCorrect);
  };

  return (
    <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Check your understanding
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {question}
      </Typography>
      <RadioGroup value={selected} onChange={(e) => setSelected(e.target.value)}>
        {options.map((opt, i) => (
          <FormControlLabel
            key={i}
            value={opt}
            control={<Radio size="small" />}
            label={opt}
            disabled={submitted}
          />
        ))}
      </RadioGroup>
      {submitted ? (
        <Alert severity={isCorrect ? 'success' : 'info'} sx={{ mt: 1 }}>
          {isCorrect ? 'Correct!' : `The answer is: ${correctAnswer}`}
        </Alert>
      ) : (
        <Button
          variant="outlined"
          size="small"
          sx={{ mt: 1 }}
          onClick={handleSubmit}
          disabled={!selected}
        >
          Check
        </Button>
      )}
    </Box>
  );
}
