import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
  } from "../ui/card";
  import { ResponsiveLine } from "@nivo/line";
  import { ResponsiveBar } from "@nivo/bar";
  import { FiHome, FiSettings, FiBarChart2, FiUsers } from "react-icons/fi";
  
  export default function AdminDashboard() {
    return (
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 text-white">
          <div className="p-6">
            <h2 className="text-2xl font-semibold">Admin Panel</h2>
          </div>
          <nav className="px-4">
            <ul className="space-y-4">
              <li>
                <a
                  href="#"
                  className="flex items-center space-x-2 text-sm hover:bg-gray-700 p-2 rounded"
                >
                  <FiHome />
                  <span>Dashboard</span>
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="flex items-center space-x-2 text-sm hover:bg-gray-700 p-2 rounded"
                >
                  <FiBarChart2 />
                  <span>Analytics</span>
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="flex items-center space-x-2 text-sm hover:bg-gray-700 p-2 rounded"
                >
                  <FiUsers />
                  <span>Users</span>
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="flex items-center space-x-2 text-sm hover:bg-gray-700 p-2 rounded"
                >
                  <FiSettings />
                  <span>Settings</span>
                </a>
              </li>
            </ul>
          </nav>
        </aside>
  
        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-muted/40">
          {/* Header */}
          <header className="bg-white shadow-md py-4 px-6">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <div className="flex items-center space-x-4">
                <span>Welcome, Admin</span>
                <button className="px-4 py-2 bg-blue-600 text-white rounded">
                  Log out
                </button>
              </div>
            </div>
          </header>
  
          <main className="p-6 space-y-8">
            <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-4">
              {/* Fleet Analytics Card */}
              <Card className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle>Fleet Analytics</CardTitle>
                  <CardDescription className="max-w-lg text-balance leading-relaxed">
                    Monitor key metrics and analyze fleet performance.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="total-vehicles"
                          className="block text-sm font-medium text-muted-foreground"
                        >
                          Total Vehicles
                        </label>
                        <p className="text-sm font-medium">125</p>
                      </div>
                      <div>
                        <label
                          htmlFor="available-vehicles"
                          className="block text-sm font-medium text-muted-foreground"
                        >
                          Available Vehicles
                        </label>
                        <p className="text-sm font-medium">92</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="active-drivers"
                          className="block text-sm font-medium text-muted-foreground"
                        >
                          Active Drivers
                        </label>
                        <p className="text-sm font-medium">84</p>
                      </div>
                      <div>
                        <label
                          htmlFor="offline-drivers"
                          className="block text-sm font-medium text-muted-foreground"
                        >
                          Offline Drivers
                        </label>
                        <p className="text-sm font-medium">12</p>
                      </div>
                    </div>
                    <LineChart className="aspect-[4/3]" />
                  </div>
                </CardContent>
              </Card>
  
              {/* Booking Analytics Card */}
              <Card className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle>Booking Analytics</CardTitle>
                  <CardDescription className="max-w-lg text-balance leading-relaxed">
                    Track key booking metrics and analyze customer trends.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="total-trips"
                          className="block text-sm font-medium text-muted-foreground"
                        >
                          Total Trips
                        </label>
                        <p className="text-sm font-medium">2,345</p>
                      </div>
                      <div>
                        <label
                          htmlFor="avg-trip-time"
                          className="block text-sm font-medium text-muted-foreground"
                        >
                          Avg. Trip Time
                        </label>
                        <p className="text-sm font-medium">25 min</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="top-driver"
                          className="block text-sm font-medium text-muted-foreground"
                        >
                          Top Driver
                        </label>
                        <p className="text-sm font-medium">John Doe</p>
                      </div>
                      <div>
                        <label
                          htmlFor="driver-rating"
                          className="block text-sm font-medium text-muted-foreground"
                        >
                          Driver Rating
                        </label>
                        <p className="text-sm font-medium">4.8</p>
                      </div>
                    </div>
                    <BarChart className="aspect-[4/3]" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  function BarChart(props) {
    return (
      <div {...props}>
        <ResponsiveBar
          data={[
            { name: "Jan", count: 111 },
            { name: "Feb", count: 157 },
            { name: "Mar", count: 129 },
            { name: "Apr", count: 150 },
            { name: "May", count: 119 },
            { name: "Jun", count: 72 },
          ]}
          keys={["count"]}
          indexBy="name"
          margin={{ top: 0, right: 0, bottom: 40, left: 40 }}
          padding={0.3}
          colors={["#2563eb"]}
          axisBottom={{
            tickSize: 0,
            tickPadding: 16,
          }}
          axisLeft={{
            tickSize: 0,
            tickValues: 4,
            tickPadding: 16,
          }}
          gridYValues={4}
          theme={{
            tooltip: {
              chip: {
                borderRadius: "9999px",
              },
              container: {
                fontSize: "12px",
                textTransform: "capitalize",
                borderRadius: "6px",
              },
            },
            grid: {
              line: {
                stroke: "#f3f4f6",
              },
            },
          }}
          tooltipLabel={({ id }) => `${id}`}
          enableLabel={false}
          role="application"
          ariaLabel="A bar chart showing data"
        />
      </div>
    );
  }
  
  function LineChart(props) {
    return (
      <div {...props}>
        <ResponsiveLine
          data={[
            {
              id: "Month wise stats number of drivers active",
              data: [
                { x: "Jan", y: 43 },
                { x: "Feb", y: 137 },
                { x: "Mar", y: 61 },
                { x: "Apr", y: 145 },
                { x: "May", y: 26 },
                { x: "Jun", y: 154 },
              ],
            },
            
          ]}
          margin={{ top: 10, right: 10, bottom: 40, left: 40 }}
          xScale={{
            type: "point",
          }}
          yScale={{
            type: "linear",
          }}
          colors={["#e11d48", "#2563eb"]}
          axisBottom={{
            tickSize: 0,
            tickPadding: 16,
          }}
          axisLeft={{
            tickSize: 0,
            tickValues: 4,
            tickPadding: 16,
          }}
          gridYValues={4}
          theme={{
            tooltip: {
              chip: {
                borderRadius: "9999px",
              },
              container: {
                fontSize: "12px",
                textTransform: "capitalize",
                borderRadius: "6px",
              },
            },
            grid: {
              line: {
                stroke: "#f3f4f6",
              },
            },
          }}
          enableGridX={false}
          pointSize={0}
          enableSlices="x"
          enableArea={true}
          enableCrosshair={false}
          role="application"
          ariaLabel="A line chart showing data"
        />
      </div>
    );
  }