class Api::V5::ConflictsController < Api::V5::ApiController
  respond_to :json
  
  def index
    section_conflicts = {}
    if params[:section_id].present?
      sections = any :section_id
      sections.each do |section|
        section_conflicts[section] = Redis.current.smembers section
      end
    end
    respond_with section_conflicts
  end
end
