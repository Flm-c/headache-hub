export default function ArticlesPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Articles & Resources</h1>
      <p className="text-gray-600 mb-8">
        Read helpful articles from our community and experts about migraine management.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sample article cards - will be replaced with real data */}
        {[1, 2, 3, 4].map((i) => (
          <article key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-40 bg-gradient-to-r from-blue-400 to-blue-600"></div>
            <div className="p-6">
              <h3 className="font-bold text-lg mb-2">Article Title {i}</h3>
              <p className="text-gray-600 text-sm mb-4">
                This is a preview of the article content. Click to read the full article...
              </p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>By Author Name</span>
                <span>2 days ago</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
