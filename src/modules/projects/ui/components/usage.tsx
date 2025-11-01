import { Fragment, MessageRole, MessageType } from '@/generated/prisma'
import React, { useMemo } from 'react'
import { Clock, MessageSquare, Zap, TrendingUp } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Line,
  LineChart,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'

interface Message {
  role: MessageRole
  content: string
  createdAt: Date
  fragment: Fragment | null
  type: MessageType
  id?: string
  inputTokens: number
  outputTokens: number
  model: string
  timeTaken?: number
}

interface Props {
  messages: Message[]
}

const tokenChartConfig = {
  inputTokens: {
    label: 'Input Tokens',
    color: 'hsl(221.2 83.2% 53.3%)',
  },
  outputTokens: {
    label: 'Output Tokens',
    color: 'hsl(142.1 76.2% 36.3%)',
  },
} satisfies ChartConfig

const timeChartConfig = {
  timeTaken: {
    label: 'Time (seconds)',
    color: 'hsl(280 100% 70%)',
  },
} satisfies ChartConfig

const Usage = ({ messages }: Props) => {
  const chartData = useMemo(() => {
    return messages
      .filter((msg) => msg.inputTokens > 0 || msg.outputTokens > 0)
      .map((msg) => ({
        name: `${msg.role}`,
        inputTokens: msg.inputTokens || 0,
        outputTokens: msg.outputTokens || 0,
        timeTaken: msg.timeTaken || 0,
        totalTokens: (msg.inputTokens || 0) + (msg.outputTokens || 0),
        role: msg.role,
      }))
  }, [messages])

  const stats = useMemo(() => {
    const relevantMessages = messages.filter(
      (msg) => msg.inputTokens > 0 || msg.outputTokens > 0
    )
    const totalInput = relevantMessages.reduce(
      (sum, msg) => sum + (msg.inputTokens || 0),
      0
    )
    const totalOutput = relevantMessages.reduce(
      (sum, msg) => sum + (msg.outputTokens || 0),
      0
    )
    const totalTime = relevantMessages.reduce(
      (sum, msg) => sum + (msg.timeTaken || 0),
      0
    )
    const avgTime =
      relevantMessages.length > 0 ? totalTime / relevantMessages.length : 0

    return {
      totalInput,
      totalOutput,
      totalTokens: totalInput + totalOutput,
      totalTime,
      avgTime,
      messageCount: relevantMessages.length,
    }
  }, [messages])

  if (chartData.length === 0) {
    return (
      <Card className="bg-transparent border-gray-200 dark:border-gray-700">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No usage data available yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-transparent border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-2">
              <CardDescription>Total Input</CardDescription>
              <CardTitle className="text-3xl flex items-center justify-between">
                <span>{stats.totalInput.toLocaleString()}</span>
                <MessageSquare className="w-6 h-6 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">tokens</p>
            </CardContent>
          </Card>

          <Card className="bg-transparent border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-2">
              <CardDescription>Total Output</CardDescription>
              <CardTitle className="text-3xl flex items-center justify-between">
                <span>{stats.totalOutput.toLocaleString()}</span>
                <Zap className="w-6 h-6 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">tokens</p>
            </CardContent>
          </Card>

          <Card className="bg-transparent border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-2">
              <CardDescription>Total Time</CardDescription>
              <CardTitle className="text-3xl flex items-center justify-between">
                <span>{stats.totalTime.toFixed(1)}s</span>
                <Clock className="w-6 h-6 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {stats.messageCount} messages
              </p>
            </CardContent>
          </Card>

          <Card className="bg-transparent border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-2">
              <CardDescription>Avg Time</CardDescription>
              <CardTitle className="text-3xl flex items-center justify-between">
                <span>{stats.avgTime.toFixed(2)}s</span>
                <TrendingUp className="w-6 h-6 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">per message</p>
            </CardContent>
          </Card>
        </div>

        {/* Token Usage Chart */}
        <Card className="bg-transparent border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle>Token Usage per Message</CardTitle>
            <CardDescription>
              Input and output tokens for each assistant message
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={tokenChartConfig}
              className="h-[300px] w-full"
            >
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="inputTokens"
                  fill="var(--color-inputTokens)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="outputTokens"
                  fill="var(--color-outputTokens)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Time Taken Chart */}
        <Card className="bg-transparent border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle>Response Time per Message</CardTitle>
            <CardDescription>
              Time taken to generate each assistant response
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={timeChartConfig}
              className="h-[250px] w-full"
            >
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="timeTaken"
                  stroke="var(--color-timeTaken)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-timeTaken)', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Usage
