'use client';
import {
  RadialBar,
  RadialBarChart,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface QualityRatingChartProps {
  rating: number;
}

export function QualityRatingChart({ rating }: QualityRatingChartProps) {
  const data = [{ name: 'Quality', value: rating, fill: 'hsl(var(--primary))' }];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <RadialBarChart
        innerRadius="80%"
        outerRadius="100%"
        barSize={20}
        data={data}
        startAngle={90}
        endAngle={-270}
      >
        <PolarAngleAxis
          type="number"
          domain={[0, 100]}
          angleAxisId={0}
          tick={false}
        />
        <RadialBar
          background
          dataKey="value"
          angleAxisId={0}
          cornerRadius={10}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-foreground text-4xl font-bold font-headline"
        >
          {rating}
        </text>
        <text
          x="50%"
          y="65%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-muted-foreground text-sm"
        >
          / 100
        </text>
      </RadialBarChart>
    </ResponsiveContainer>
  );
}
