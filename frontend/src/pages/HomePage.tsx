export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="text-center py-16">
        <h1 className="text-5xl font-bold mb-4">Take Control of Your Migraines</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Track your migraine episodes, discover patterns, and connect with a supportive community
        </p>
        <div className="flex gap-4 justify-center">
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold">
            Get Started
          </button>
          <button className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 font-semibold">
            Learn More
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-3xl mb-4">📊</div>
          <h3 className="font-bold text-lg mb-2">Track Episodes</h3>
          <p className="text-gray-600">
            Log migraine episodes with severity, duration, triggers, and notes in an easy-to-use calendar interface
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-3xl mb-4">📈</div>
          <h3 className="font-bold text-lg mb-2">Analyze Trends</h3>
          <p className="text-gray-600">
            Visualize patterns, identify triggers, and understand what factors affect your migraines
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-3xl mb-4">👥</div>
          <h3 className="font-bold text-lg mb-2">Community Support</h3>
          <p className="text-gray-600">
            Read helpful articles from experts and connect with others who understand your struggle
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-blue-600 text-white rounded-lg p-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold mb-2">1,234</div>
            <p>Active Users</p>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">12,456</div>
            <p>Episodes Tracked</p>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">89</div>
            <p>Helpful Articles</p>
          </div>
        </div>
      </section>
    </div>
  );
}
