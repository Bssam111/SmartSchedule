import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">SmartSchedule</h1>
        <p className="text-gray-600 mb-8">University Scheduling System</p>
        
        <div className="space-y-4">
          <Link 
            href="/login" 
            className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Login to Continue
          </Link>
          
          <div className="text-sm text-gray-500">
            <p>Demo Access:</p>
            <p>• Students: View schedules & preferences</p>
            <p>• Faculty: Manage availability & assignments</p>
            <p>• Committee: Generate & review schedules</p>
          </div>
        </div>
      </div>
    </div>
  );
}
