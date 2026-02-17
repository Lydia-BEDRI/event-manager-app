import React from 'react';
import { Search } from 'lucide-react';
import Input from '../atoms/Input';

const SearchBar: React.FC = () => {
  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-gray" size={18} />
      <Input
        placeholder="Rechercher ..."
        className="pl-10 bg-white"
      />
    </div>
  );
};

export default SearchBar;
