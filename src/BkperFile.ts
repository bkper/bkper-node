import Book from "./Book";
import * as FileService_ from './FileService_';

/**
 * 
 * This class defines a File uploaded to a [[Book]].
 * 
 * A File can be attached to a [[Transaction]] or used to import data.
 * 
 * @public
 */
export default class BkperFile {

  wrapped: bkper.File;

  book: Book;

  /**
   * Gets the File id
   */
  public getId(): string {
    return this.wrapped.id;
  }

  /**
   * Gets the File name
   */
  public getName(): string {
    return this.wrapped.name;
  }

  /**
   * 
   * Sets the name of the File.
   * 
   * @returns This File, for chainning.
   */    
  public setName(name: string): BkperFile {
    this.wrapped.name = name;
    return this;
  }  

  /**
   * Gets the File content type
   */
  public getContentType(): string {
    return this.wrapped.contentType;
  }

  /**
   * 
   * Sets the File content type.
   * 
   * @returns This File, for chainning.
   */    
  public setContentType(contentType: string): BkperFile {
    this.wrapped.contentType = contentType;
    return this;
  }    

  /**
   * Gets the file content Base64 encoded
   */
  public async getContent(): Promise<string> {
    if (this.getId() != null && (this.wrapped == null || this.wrapped.content == null)) {
      this.wrapped = await FileService_.getFile(this.book.getId(), this.getId());
    }
    return this.wrapped.content;
  }

  /**
   * 
   * Sets the File content Base64 encoded.
   * 
   * @returns This File, for chainning.
   */    
  public setContent(content: string): BkperFile {
    this.wrapped.content = content;
    return this;
  } 
 
  /**
   * Gets the file serving url for accessing via browser
   */
  public getUrl(): string {
    return this.wrapped.url;
  }

  /**
   * Gets the file size in bytes
   */  
  public getSize(): number {
    return this.wrapped.size;
  }


  /**
   * Perform create new File.
   */
  public async create(): Promise<BkperFile> {
    this.wrapped = await FileService_.createFile(this.book.getId(), this.wrapped);
    return this;
  }

}