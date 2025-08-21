// New EducationModule.tsx
export const EducationModule: React.FC<{ userProfile: UserProfile }> = ({ userProfile }) => {
  const educationTopics = [
    {
      title: "Superannuation Basics",
      description: "Learn the fundamentals of Australian super system",
      lessons: ["How super works", "Contribution limits", "Investment options", "Accessing your super"]
    },
    {
      title: "Investment Strategies",
      description: "Build wealth through smart investing",
      lessons: ["Asset allocation", "Diversification", "Risk management", "Market timing"]
    },
    {
      title: "Retirement Planning",
      description: "Plan for a comfortable retirement",
      lessons: ["Retirement income streams", "Age pension", "Estate planning", "Healthcare costs"]
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Financial Education Hub</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {educationTopics.map((topic, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-slate-900 mb-2">{topic.title}</h3>
            <p className="text-sm text-slate-600 mb-4">{topic.description}</p>
            
            <div className="space-y-2">
              {topic.lessons.map((lesson, lessonIndex) => (
                <div key={lessonIndex} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                  <span className="text-sm text-slate-700">{lesson}</span>
                </div>
              ))}
            </div>
            
            <button className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Start Learning
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
