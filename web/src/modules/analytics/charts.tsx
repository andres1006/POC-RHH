'use client'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const axis = { fontSize: 12, fill: 'var(--muted)' }
const tip = { contentStyle: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 } }

export function ByArea({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
        <XAxis type="number" tick={axis} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="name" tick={axis} axisLine={false} tickLine={false} width={110} />
        <Tooltip {...tip} cursor={{ fill: 'var(--bg)' }} />
        <Bar dataKey="value" name="Personas" fill="var(--primary)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function Headcount({ data }: { data: { month: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="month" tick={axis} axisLine={false} tickLine={false} />
        <YAxis tick={axis} axisLine={false} tickLine={false} allowDecimals={false} width={30} domain={['dataMin - 2', 'dataMax + 1']} />
        <Tooltip {...tip} />
        <Line dataKey="value" name="Headcount" stroke="var(--primary)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

const SHADES = ['var(--primary)', 'color-mix(in srgb, var(--primary) 45%, var(--surface))']

export function Contracts({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2} stroke="var(--surface)">
          {data.map((_, i) => <Cell key={i} fill={SHADES[i % SHADES.length]} />)}
        </Pie>
        <Tooltip {...tip} />
      </PieChart>
    </ResponsiveContainer>
  )
}
